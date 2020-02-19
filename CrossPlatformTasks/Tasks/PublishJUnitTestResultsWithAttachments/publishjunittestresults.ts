import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import path = require('path');
import fs = require('fs');
import util = require("util");
import * as helperContracts from './helperContracts';
import * as apiContracts from './azdoApiContracts';
import * as rh from './restApiHelper';
import { match } from 'assert';

require('util.promisify').shim();
var request = require('request');
require('request').debug = true

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        const runSettings = {} as helperContracts.inputContract;

        runSettings.targetType = tl.getInput('targetType', true) as string;
        runSettings.jsonTestCaseMappingFile = tl.getPathInput('jsonTestCaseMappingFile', (runSettings.targetType == 'filePath') ? true : false) as string;
        runSettings.inlineJsonTestCaseMapping = tl.getInput('inlineJsonTestCaseMapping', (runSettings.targetType == 'inline') ? true : false) as string;
        runSettings.testPlanId = parseInt(`${tl.getInput('testPlan', true)}`);
        runSettings.testSuiteStrings = tl.getDelimitedInput('testSuite', ',', true);
        runSettings.testConfiguration = parseInt(`${tl.getInput('testConfiguration', true)}`);
        runSettings.generalAttachments = tl.getDelimitedInput('generalAttachments', '\n', false);
        runSettings.sourceFolder = getStringValue(tl.getPathInput('sourceFolder', true, true));
        runSettings.apiBatchSize = (tl.getVariable('JUnitTestCase.BatchSize') && tl.getVariable('JUnitTestCase.BatchSize') != '' ? parseInt(`${tl.getVariable('JUnitTestCase.BatchSize')}`) : 20);
        
        let jsonMapping: string = getTestCaseJsonMapping(`${runSettings.targetType}`, `${runSettings.jsonTestCaseMappingFile}`, `${runSettings.inlineJsonTestCaseMapping}`);

        console.log(`Parsing JSON mapping: ${jsonMapping}`);
        runSettings.jsonTestCaseMapping = JSON.parse(jsonMapping);

        runSettings.organization = `${tl.getVariable('System.TeamFoundationCollectionUri')}`;
        runSettings.project = `${tl.getVariable('System.TeamProject')}`;
        runSettings.accessToken = `${tl.getVariable('System.AccessToken')}`;
        
        let baseUrl: string = `${runSettings.organization}/${runSettings.project}`
        const helper: rh.RestApiHelper = new rh.RestApiHelper(baseUrl, runSettings.accessToken);
        
        let reqBody: apiContracts.testRunRequestBody = getTestRunRequestBody(runSettings);
        
        let testRunId: number = -1;
        console.log('Creating test run entry.');

        let response: apiContracts.testRunResponse = await helper.createTestRun(reqBody);

        if(response != null)
        {
            try
            {
                testRunId = response.id;
        
                console.log(`Recieved testRunId: ${testRunId}`);

                let outcome = await uploadTestCaseResults(testRunId, runSettings, helper);

                // TODO: Add logic to upload general attachment

                await uploadGeneralAttachments(testRunId, runSettings, helper);

                console.log('Updating test run with final outcome.')
                let body: apiContracts.testRunUpdateRequestBody = {} as apiContracts.testRunUpdateRequestBody;

                body.state = getFinalTestResultsOutcome(outcome);

                console.log('Updating test run status to ' + body.state);
                await helper.completeTestRun(testRunId, body);

                console.log('Exiting task.');
            }
            catch(err)
            {                
                let body: apiContracts.testRunUpdateRequestBody = {} as apiContracts.testRunUpdateRequestBody;
                body.state = "Aborted";
                await helper.completeTestRun(testRunId, body);

                tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
            }
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}

function getStringValue(val: string | undefined): string
{
    if(!val)
        return "";
    else
        return val.valueOf();
}
/**
 * Create the request body to be used in creating the new test run
 * @param settings runSettings for the execution of the task
 */
function getTestRunRequestBody(settings: helperContracts.inputContract): apiContracts.testRunRequestBody
{
    let body: apiContracts.testRunRequestBody =  {} as apiContracts.testRunRequestBody;

    body.name = getTestRunTitle();
    body.automated = true;
    body.plan = {
              id: settings.testPlanId
            };
    body.pointIds = [
        settings.testConfiguration
            ];

    return body;
}

async function uploadGeneralAttachments(testRunId: number, runSettings: helperContracts.inputContract, helper: rh.RestApiHelper)
{
    return new Promise(async (resolve, reject)=> {
        try
        {
            let sourceFolder: string = path.normalize(runSettings.sourceFolder);
            let allPaths: string[] = tl.find(sourceFolder); // default find options (follow sym links)
            let sourceFolderPattern = sourceFolder.replace('[','[[]'); // directories can have [] in them, and they have special meanings as a pattern, so escape them

            let matchedPaths: string[] = tl.match(allPaths, runSettings.generalAttachments, sourceFolderPattern); // default match options
            let matchedFiles: string[] = matchedPaths.filter((itemPath: string) => !tl.stats(itemPath).isDirectory()); // filter-out directories

            // copy the files to the target folder
            console.log(tl.loc('FoundNFiles', matchedFiles.length));
            
            if(matchedFiles.length > 0){
                for(var i: number = 0; i < matchedFiles.length; i++)
                {
                    let file: string = matchedFiles[i];       
                    
                    let request: apiContracts.testRunAttachmentRequestBody =  {} as apiContracts.testRunAttachmentRequestBody
                    request.attachmentType = "GeneralAttachment";
                    request.fileName = path.basename(file);
                    request.stream = fs.readFileSync(file, 'utf8');
                
                    let response: apiContracts.testRunAttachmentReference = await helper.createTestRunAttachment(testRunId, request);

                    if(response == null)
                    {
                        throw new Error('Failed to add test results');
                    }
                };
            }

            resolve("success");
        }
        catch(err)
        {
            console.log("Unable to update test case results" + err.message);
            reject(err.message);
        }
    });
}
async function uploadTestCaseResults(testRunId: number, runSettings: helperContracts.inputContract, helper: rh.RestApiHelper): Promise<helperContracts.TestRunState>
{
    return new Promise<helperContracts.TestRunState>(async (resolve, reject)=> {
        try
        {
            var sizeCount: number = 0;
            let finalOutcome: helperContracts.TestRunState = helperContracts.TestRunState.Completed;

            var testResults: apiContracts.testCaseResult[] = [];
            var testRunExistingResults: apiContracts.testCaseResult[] = await helper.getTestRunResults(testRunId);

            //TODO: Index the results to improve performance
            //var indexedTestRunResults = indexExistingResults(testRunExistingResults);

            console.log('Retrieved ' + testRunExistingResults.length + ' existing results');
            console.log('Posting testcase results');
            console.log('Testcase mappings count: ' + runSettings.jsonTestCaseMapping.length);

            for(var i: number = 0; i < runSettings.jsonTestCaseMapping.length; i++){
                let entry: any = runSettings.jsonTestCaseMapping[i];            
                console.log("Retrieving the JUnit test result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                let testResult: helperContracts.testResult = getJUnitTestResult(entry.className, entry.methodName);
                console.log("Retrieving existing test run result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                let existingRecord: apiContracts.testCaseResult = getTargetTestResult(parseInt(entry.testCaseId), parseInt(entry.testSuiteId), testRunExistingResults);
                console.log("Retrieved " + existingRecord);
                //TODO
                //let existingRecord: apiContracts.testCaseResult = indexedTestRunResults[entry.testCaseId][entry.testSuiteId];
                
                /*let outcome: apiContracts.testCaseResult =  {
                    testPlan: {
                        id: runSettings.testPlanId
                    },
                    testCaseTitle: testResult.testCaseTitle,
                    testCase: {
                        id: parseInt(entry.testCaseId)
                    },
                    testCaseRevision: 1,
                    testPoint:{
                        id: runSettings.testConfiguration
                    },
                    priority: 1,
                    outcome: (testResult.outcome ? "Passed" : "Failed")
                }*/

                if(existingRecord)
                {
                    let outcome: apiContracts.testCaseResult =  {} as apiContracts.testCaseResult
                    outcome.id = existingRecord.id;
                    outcome.outcome = (testResult.outcome ? "Passed" : "Failed");
                    outcome.state = "Completed";

                    testResults.push(outcome);
                }
                sizeCount++;

                if(testResults.length > 0 && (i == runSettings.jsonTestCaseMapping.length - 1 || sizeCount >= runSettings.apiBatchSize))
                {
                    console.log('Sending batch of test results.');

                    let response: apiContracts.testResultResponse = await helper.updateTestResults(testRunId, testResults);

                    if(response == null)
                    {
                        throw new Error('Failed to add test results');
                    }

                    sizeCount = 0;
                    testResults = [];
                }
            }

            resolve(finalOutcome);
        }
        catch(err)
        {
            console.log("Unable to update test case results" + err.message);
            reject(err.message);
        }
    });
}
function getTargetTestResult(testCaseId: number, testSuiteId: number, existingTestResults: apiContracts.testCaseResult[]): apiContracts.testCaseResult {
    console.log("Recieved test case: " + testCaseId + " and suite: " + testSuiteId + " with existing results: " + existingTestResults.length);

    let emptyResult: apiContracts.testCaseResult = {} as apiContracts.testCaseResult;
    for(var index: number = 0; index < existingTestResults.length; index++)
    {
        console.log("inside loop");
        let entry = existingTestResults[index];

        console.log("Entry is " + entry);
        console.log("TestCase is " + entry.testCase);
        console.log("Checking entry with " + existingTestResults[index].testCase.id  + " suite id " + existingTestResults[index]?.testSuite?.id);
        if(existingTestResults[index].testCase.id == testCaseId && (!existingTestResults[index].testSuite || (existingTestResults[index].testSuite && existingTestResults[index].testSuite.id == testSuiteId)))
        {
            console.log("Found matching test result for test case " + testCaseId + " and suite " + testSuiteId);
            return existingTestResults[index];
        }
    }
    console.log("No matching test result found for testCaseId" + testCaseId + "/ testSuiteId " + testSuiteId + ".\n Please check the specified testCaseId and testSuiteId in your JSON mapping");
    return emptyResult;
}
/**
 * Index the collection of test case results to minimize time spent iterating over the list for each test case
 * @param existingTestResults 
 */
function indexExistingResults(existingTestResults: apiContracts.testCaseResult[]): { [id: number] : { [id:number] : apiContracts.testCaseResult }; }{
    var indexedTestCaseResults: { [id: number] : { [id:number] : apiContracts.testCaseResult }; } = {};

    console.log("Indexing test case results");
    for(var i: number = 0; i < existingTestResults.length; i++)
    {
        let entry = existingTestResults[i];

        console.log("Checking for entry test case id: " + entry.testCase.id);
        if(!indexedTestCaseResults[entry.testCase.id])
        {
            try
            {
                console.log("Test case id: " + entry.testCase.id + " does not exist. Creating new entry.");
                indexedTestCaseResults[entry.testCase.id] =  [];
            }
            catch(error)
            {
                console.log(error);
            }
        }

        console.log("Assigning entry to the test suite id: " + entry.testSuite.id);
        indexedTestCaseResults[entry.testCase.id][entry.testSuite.id] = entry;
    }
    console.log("Returning indexed results");
    return indexedTestCaseResults;
}

function getJUnitTestResult(className: string, methodName: string): helperContracts.testResult
{
    // TODO: Add logic to retrieve the test outcome from the available JUnit test results
    let result: helperContracts.testResult = {} as helperContracts.testResult;

    result.testCaseTitle = "Login to the app";
    result.outcome = "Passed";

    return result;
}
function getFinalTestResultsOutcome(outcome: helperContracts.TestRunState): string
{
    switch(outcome)
    {
        case helperContracts.TestRunState.Aborted:
            return "Aborted";
        case helperContracts.TestRunState.Completed:
            return "Completed";
        case helperContracts.TestRunState.InProgress:
            return "InProgress";
        case helperContracts.TestRunState.NotStarted:
            return "NotStarted";
        case helperContracts.TestRunState.Waiting:
            return "Waiting";
        default:
            return "Aborted";
    }
}
function getTestRunTitle(): string
{
    console.log('Generating test run title.');
    let definitionName = tl.getVariable('BUILD_DEFINITIONNAME');
    let buildOrReleaseName = tl.getVariable('BUILD_BUILDNUMBER');

    if (tl.getVariable('Release.ReleaseUri') && tl.getVariable('Release.ReleaseUri') != '') {
        definitionName = tl.getVariable('RELEASE_DEFINITIONNAME');
        buildOrReleaseName = tl.getVariable('RELEASE_RELEASENAME');
    }

    return `TestRun_${definitionName}_${buildOrReleaseName}`;
}
function getTestCaseJsonMapping(targetType: string, mappingFile: string, inlineJson: string): string
{
    let jsonMapping: string = '';

    if (targetType == 'filePath')
    {
        console.log('Retrieving json mapping file content.');
        let filePath: string = path.join(__dirname, `${mappingFile}`);

        const fileExists = util.promisify(fs.exists);
        const readFileContents = util.promisify(fs.readFile);

        fileExists(filePath)
            .then((exists) => {
                if(exists == true)
                {
                    console.log('File found.'); 

                    readFileContents(filePath, 'utf-8')
                        .then((text)=>
                        {
                            jsonMapping = text;
                        })
                        .catch((err)=>{
                            console.error(`Could not read specified mapping file '${filePath}': ${err}`);
                        })
                }
                else
                {
                    console.error(`Failed to locate specified mapping file '${filePath}'`);
                }
            })
            .catch((err)=>
            {
                console.error(`Failed to locate specified mapping file '${filePath}': ${err}`);
            });
    }
    else
    {
        jsonMapping = `${inlineJson}`;
    }

    return jsonMapping;
}

run();
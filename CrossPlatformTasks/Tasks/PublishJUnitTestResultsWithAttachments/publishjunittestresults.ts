import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import path = require('path');
import url = require('url');
import fs = require('fs');
import util from "./taskUtil";
import * as helperContracts from './helperContracts';
import * as apiContracts from './azdoApiContracts';
import * as rh from './restApiHelper';


var xml2js = require('xml2js');

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        const runSettings = {} as helperContracts.inputContract;

        runSettings.targetType = tl.getInput('targetType', true) as string;
        runSettings.jsonTestCaseMappingFile = tl.getPathInput('jsonTestCaseMappingFile', (runSettings.targetType == 'filePath') ? true : false) as string;
        runSettings.inlineJsonTestCaseMapping = tl.getInput('inlineJsonTestCaseMapping', (runSettings.targetType == 'inline') ? true : false) as string;
        runSettings.testPlanId = parseInt(`${tl.getInput('testPlan', true)}`);
        runSettings.testSuiteIds = tl.getDelimitedInput('testSuite', ',', true);
        runSettings.testConfiguration = parseInt(`${tl.getInput('testConfiguration', true)}`);
        runSettings.testResultsOutputFile = tl.getInput('testResultsOutputFile', true) as string;
        runSettings.generalAttachments = tl.getDelimitedInput('generalAttachments', '\n', false);
        runSettings.sourceFolder = util.getStringValue(tl.getPathInput('sourceFolder', true, false));
        runSettings.apiBatchSize = (tl.getVariable('JUnitTestCase.BatchSize') && tl.getVariable('JUnitTestCase.BatchSize') != '' ? parseInt(`${tl.getVariable('JUnitTestCase.BatchSize')}`) : 20);
        
        let jsonMapping: string = getTestCaseJsonMapping(`${runSettings.targetType}`, `${runSettings.jsonTestCaseMappingFile}`, `${runSettings.inlineJsonTestCaseMapping}`);

        console.log(`Parsing JSON mapping: ${jsonMapping}`);
        runSettings.jsonTestCaseMapping = JSON.parse(jsonMapping); 
        console.log(`Parsing JUnit Test Results file: ${runSettings.testResultsOutputFile}`);
        runSettings.parsedJUnitTestResults = await parseJUnitTestResultsFile(runSettings.testResultsOutputFile);

        runSettings.organization = `${tl.getVariable('System.TeamFoundationCollectionUri')}`;
        runSettings.project = `${tl.getVariable('System.TeamProject')}`;
        runSettings.accessToken = `${tl.getVariable('System.AccessToken')}`;
        
        tl.debug('Retrieved organization: ' + runSettings.organization);
        tl.debug('Retrieved project: ' + runSettings.project);
        tl.debug('Retrieved accessToken: ' + runSettings.accessToken);
        tl.debug('testPlanId=' + runSettings.testPlanId);
        tl.debug('testSuiteIds=' + util.concatArray(runSettings.testSuiteIds));
        tl.debug('testConfiguration=' + runSettings.testConfiguration);
        tl.debug('testResultsOutputFile=' + runSettings.testResultsOutputFile);
        tl.debug('generalAttachments=' + runSettings.generalAttachments);
        tl.debug('sourceFolder=' + runSettings.sourceFolder);
        tl.debug('apiBatchSize (env:JUnitTestCase.BatchSize)=' + runSettings.apiBatchSize);

        let baseUrl: string = url.resolve(runSettings.organization, runSettings.project);
        tl.debug('Creating httpClient with: ' + baseUrl);
        const helper: rh.RestApiHelper = new rh.RestApiHelper(baseUrl, runSettings.accessToken);
        
        runSettings.testPoints =  await helper.getTestPoints(runSettings.testPlanId, runSettings.testSuiteIds, runSettings.testConfiguration);

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
        if(err)
        {
            tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed', true);
        }
        else
        {
            tl.setResult(tl.TaskResult.Failed, "Task failed", true);
        }
    }
}
/**
 * 
 * @param filePath path to the JUnit test results file
 */
async function parseJUnitTestResultsFile(filePath: string): Promise<helperContracts.jUnitTestResultRoot>
{
    return new Promise(async (resolve, reject)=> {
        try
        {
            tl.debug('Reading JUnit test results XML')
            var contents: string = fs.readFileSync(filePath, 'utf8');
            var parser = new xml2js.Parser({mergeAttrs: true});
            var result = await parser.parseStringPromise(contents);
            tl.debug('Parsing XML to JS')
            var obj = JSON.stringify(result);
            var generic: helperContracts.jUnitTestResultRootGeneric = (JSON.parse(obj) as helperContracts.jUnitTestResultRootGeneric);
            var root: helperContracts.jUnitTestResultRoot = {} as helperContracts.jUnitTestResultRoot;

            if(generic.testsuite && generic.testsuite.testcase && generic.testsuite.testcase.length > 0)
            {
                root.testsuites = [];
                root.testsuites.push(generic.testsuite);
            }
            
            if(generic.testsuites)
            {
                root.testsuites = generic.testsuites.testsuite;
            }

            tl.debug('Returning converted test suites results')
            resolve(root);
        }
        catch(err)
        {
            console.log("Failed to parse JUnit XML results file: " + err.message);
            reject(err);
        }
    });
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
    body.pointIds = settings.testPoints;

    if(tl.getVariable('Build.RequestedFor') && util.getStringValue(tl.getVariable('Build.RequestedFor')) != "")
    {
        body.owner = {} as apiContracts.identityRef;
        body.owner.id = util.getStringValue(tl.getVariable('Build.RequestedFor'));
    }    
    if(tl.getVariable('Build.BuildId') && util.getStringValue(tl.getVariable('Build.BuildId')) != "")
    {
        body.build = {} as apiContracts.shallowReference;
        body.build.id = util.getStringValue(tl.getVariable('Build.BuildId'));
        body.build.url = util.getStringValue(tl.getVariable('Build.BuildUri'));
    }    
    if(tl.getVariable('Release.ReleaseId') && tl.getVariable('Release.EnvironmentId') && tl.getVariable('Release.ReleaseUri'))
    {
        body.releaseReference = {} as apiContracts.releaseReference;
        body.releaseReference.id = parseInt(util.getStringValue(tl.getVariable('Release.ReleaseId')));
        body.releaseReference.name = util.getStringValue(tl.getVariable('Release.ReleaseName'));
        body.releaseReference.environmentId = parseInt(util.getStringValue(tl.getVariable('Release.EnvironmentId')));

        body.releaseUri = util.getStringValue(tl.getVariable('Release.ReleaseUri'));
        body.releaseEnvironmentUri = util.getStringValue(tl.getVariable('Release.EnvironmentUri'));
    }
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
            tl.debug("Located " + matchedFiles.length + " files.");
            
            if(matchedFiles.length > 0){
                for(var i: number = 0; i < matchedFiles.length; i++)
                {
                    let file: string = matchedFiles[i];       
                    
                    let request: apiContracts.testRunAttachmentRequestBody =  {} as apiContracts.testRunAttachmentRequestBody
                    request.attachmentType = "GeneralAttachment";
                    request.fileName = path.basename(file);
                    let fileContents = fs.readFileSync(file)
                    request.stream = fileContents.toString('base64');
                
                    let response: apiContracts.testRunAttachmentReference = await helper.createTestRunAttachment(testRunId, request);

                    if(response == null)
                    {
                        throw new Error('Failed to add test results attachment');
                    }
                };
            }

            resolve("success");
        }
        catch(err)
        {
            console.log("Unable to update test case results" + err.message);
            
            if(err)
            {
                reject(err);
            }
            else
            {
                console.log("Unable to update test case results");
                reject();
            }
        }
    });
}
async function uploadTestCaseResults(testRunId: number, runSettings: helperContracts.inputContract, helper: rh.RestApiHelper): Promise<helperContracts.TestRunState>
{
    return new Promise<helperContracts.TestRunState>(async (resolve, reject)=> {
        try
        {
            let finalOutcome: helperContracts.TestRunState = helperContracts.TestRunState.Completed;

            var testResults: apiContracts.testCaseResult[] = [];
            var testRunExistingResults: apiContracts.testCaseResult[] = await helper.getTestRunResults(testRunId);

            //TODO: Index the results to improve performance
            //var indexedTestRunResults = indexExistingResults(testRunExistingResults);

            tl.debug('Retrieved ' + testRunExistingResults.length + ' existing results');
            tl.debug('Posting testcase results');
            tl.debug('Testcase mappings count: ' + runSettings.jsonTestCaseMapping.length);

            for(var i: number = 0; i < runSettings.jsonTestCaseMapping.length; i++){
                let entry: any = runSettings.jsonTestCaseMapping[i];            
                tl.debug("Retrieving the JUnit test result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                let testResult: apiContracts.testCaseResult | null = getJUnitTestResult(runSettings.parsedJUnitTestResults, entry.className, entry.methodName);
                tl.debug("Retrieving existing test run result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                let existingRecord: apiContracts.testCaseResult = getTargetTestResult(parseInt(entry.testCaseId), parseInt(entry.testSuiteId), testRunExistingResults);
                tl.debug("Retrieved " + existingRecord);
                //TODO
                //let existingRecord: apiContracts.testCaseResult = indexedTestRunResults[entry.testCaseId][entry.testSuiteId];

                if(existingRecord && existingRecord.id)
                {
                    let outcome: apiContracts.testCaseResult =  {} as apiContracts.testCaseResult
                    outcome.id = existingRecord.id;
                    outcome.outcome = (testResult ? testResult.outcome : "NotExecuted");
                    outcome.errorMessage = (testResult ? testResult.errorMessage : "");
                    outcome.state = "Completed";

                    testResults.push(outcome);
                }

                if(testResults.length > 0 && (i == runSettings.jsonTestCaseMapping.length - 1 || testResults.length >= runSettings.apiBatchSize))
                {
                    console.log('Sending batch of test results.');

                    let response: apiContracts.testResultResponse = await helper.updateTestResults(testRunId, testResults);

                    if(response == null)
                    {
                        throw new Error('Failed to add test results');
                    }

                    testResults = [];
                }
            }

            resolve(finalOutcome);
        }
        catch(err)
        {
            console.log("Unable to update test case results: " + err.message);
            reject(err);
        }
    });
}
function getTargetTestResult(testCaseId: number, testSuiteId: number, existingTestResults: apiContracts.testCaseResult[]): apiContracts.testCaseResult {
    tl.debug("Recieved test case: " + testCaseId + " and suite: " + testSuiteId + " with existing results: " + existingTestResults.length);

    let emptyResult: apiContracts.testCaseResult = {} as apiContracts.testCaseResult;
    for(var index: number = 0; index < existingTestResults.length; index++)
    {
        tl.debug("inside loop");
        let entry = existingTestResults[index];

        tl.debug("Entry is " + entry);
        tl.debug("TestCase is " + entry.testCase);
        tl.debug("Checking entry with " + existingTestResults[index].testCase.id  + " suite id " + existingTestResults[index]?.testSuite?.id);
        if(existingTestResults[index].testCase.id == testCaseId && (!existingTestResults[index].testSuite || (existingTestResults[index].testSuite && existingTestResults[index].testSuite.id == testSuiteId)))
        {
            tl.debug("Found matching test result for test case " + testCaseId + " and suite " + testSuiteId);
            return existingTestResults[index];
        }
    }
    tl.debug("No matching test result found for testCaseId" + testCaseId + "/ testSuiteId " + testSuiteId + ".\n Please check the specified testCaseId and testSuiteId in your JSON mapping");
    return emptyResult;
}
/**
 * Index the collection of test case results to minimize time spent iterating over the list for each test case
 * @param existingTestResults 
 */
function indexExistingResults(existingTestResults: apiContracts.testCaseResult[]): { [id: number] : { [id:number] : apiContracts.testCaseResult }; }{
    var indexedTestCaseResults: { [id: number] : { [id:number] : apiContracts.testCaseResult }; } = {};

    tl.debug("Indexing test case results");
    for(var i: number = 0; i < existingTestResults.length; i++)
    {
        let entry = existingTestResults[i];

        tl.debug("Checking for entry test case id: " + entry.testCase.id);
        if(!indexedTestCaseResults[entry.testCase.id])
        {
            try
            {
                tl.debug("Test case id: " + entry.testCase.id + " does not exist. Creating new entry.");
                indexedTestCaseResults[entry.testCase.id] =  [];
            }
            catch(error)
            {
                console.log(error);
            }
        }

        tl.debug("Assigning entry to the test suite id: " + entry.testSuite.id);
        indexedTestCaseResults[entry.testCase.id][entry.testSuite.id] = entry;
    }
    console.log("Returning indexed results");
    return indexedTestCaseResults;
}

function getJUnitTestResult(parsedJUnitTestResults: helperContracts.jUnitTestResultRoot, className: string, methodName: string): apiContracts.testCaseResult | null
{
    for(var s: number = 0; s < parsedJUnitTestResults.testsuites.length; s++)
    {
        let suite: helperContracts.testSuite = parsedJUnitTestResults.testsuites[s];

        tl.debug('Checking test suite ' + suite.name);
        if(suite.testcase)
        {
            for(var t: number = 0; t < suite.testcase.length; t++)
            {
                let testCase: helperContracts.testCase = suite.testcase[t];
                tl.debug('Checking test case [' + testCase.name + ',' + testCase.classname + ']');
                if(util.stringIsEqual(testCase.classname, className) && util.stringIsEqual(testCase.name, methodName))
                {
                    tl.debug('Located test case result for ' + testCase.classname);
                    return parsedTestCaseResult(testCase);
                }
            }
        }
    }

    return null;
}

function parsedTestCaseResult(testCase: helperContracts.testCase): apiContracts.testCaseResult | null
{
    try
    {
        let result: apiContracts.testCaseResult = {} as apiContracts.testCaseResult;

        result.testCaseTitle = testCase.name[0];

        if(util.isEmptyArray(testCase.failure) && util.isEmptyArray(testCase.skipped) && util.isEmptyArray(testCase.error))
        {
            result.outcome = "Passed";
        }
        else if(!util.isEmptyArray(testCase.failure))
        {
            result.outcome = "Failed";
            result.errorMessage = util.squashArray(testCase.failure);
            //result.failureType = squashArray(testCase.failure, "type");
        }
        else if(!util.isEmptyArray(testCase.skipped))
        {
            result.outcome = "NotExecuted";
            //result.errorMessage = squashArray(testCase.skipped);
            //result.failureType = squashArray(testCase.failure, "type");
        }
        else if(!util.isEmptyArray(testCase.error))
        {
            result.outcome = "Error";
            result.errorMessage = util.squashArray(testCase.error);
            //result.failureType = squashArray(testCase.failure, "type");
        }
        
        tl.debug(testCase.classname + ' marked as: ' + result.outcome);
        return result;
    }
    catch(err)
    {
        console.log(`Failed to parse test case result from input: ${err.message}`);
    }
    return null;
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
    tl.debug('Generating test run title.');
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
        tl.debug('Retrieving json mapping file content.');
        let filePath: string | null = null;

        if(fs.existsSync(mappingFile))
            filePath = mappingFile;
        else if(fs.existsSync(path.join(__dirname, `${mappingFile}`)))
            filePath = path.join(__dirname, `${mappingFile}`);

        if(filePath)
        {
            console.log('File found.'); 

            try
            {
                jsonMapping = fs.readFileSync(filePath?.toString(), 'utf8');
            }
            catch(err){
                console.error(`Could not read specified mapping file '${filePath}': ${err}`);
                throw err
            }
        }
        else
        {
            console.error(`Failed to locate specified mapping file '${filePath}'`);
            throw new Error(`Failed to locate specified mapping file '${filePath}'`);
        }
    }
    else
    {
        jsonMapping = `${inlineJson}`;
    }

    return jsonMapping;
}

run();
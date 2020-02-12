import tl = require('azure-pipelines-task-lib/task');
import tr = require('azure-pipelines-task-lib/toolrunner');
import path = require('path');
import fs = require('fs');
import util = require("util");
import { inputContract } from './inputContract';
import * as apiContracts from './azdoApiContracts';
import * as rh from './restApiHelper';

require('util.promisify').shim();
var request = require('request');
require('request').debug = true

async function run() {
    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        const runSettings = {} as inputContract;

        runSettings.targetType = tl.getInput('targetType', true) as string;
        runSettings.jsonTestCaseMappingFile = tl.getPathInput('jsonTestCaseMappingFile', (runSettings.targetType == 'filePath') ? true : false) as string;
        runSettings.inlineJsonTestCaseMapping = tl.getInput('inlineJsonTestCaseMapping', (runSettings.targetType == 'inline') ? true : false) as string;
        runSettings.testPlanId = parseInt(`${tl.getInput('testPlan', true)}`);
        runSettings.testSuiteStrings = tl.getDelimitedInput('testSuite', ',', true);
        runSettings.testConfiguration = parseInt(`${tl.getInput('testConfiguration', true)}`);
        runSettings.generalAttachments = tl.getInput('generalAttachments', false) as string;
        runSettings.apiBatchSize = (tl.getVariable('JUnitTestCase.BatchSize') && tl.getVariable('JUnitTestCase.BatchSize') != '' ? parseInt(`${tl.getVariable('JUnitTestCase.BatchSize')}`) : 20);
        
        let jsonMapping: string = getTestCaseJsonMapping(`${runSettings.targetType}`, `${runSettings.jsonTestCaseMappingFile}`, `${runSettings.inlineJsonTestCaseMapping}`);

        console.log(`Parsing JSON mapping: ${jsonMapping}`);
        runSettings.jsonTestCaseMapping = JSON.parse(jsonMapping);

        runSettings.organization = `${tl.getVariable('System.TeamFoundationCollectionUri')}`;
        runSettings.project = `${tl.getVariable('System.TeamProject')}`;
        runSettings.accessToken = `${tl.getVariable('System.AccessToken')}`;
        
        let baseUrl: string = `${runSettings.organization}/${runSettings.project}`
        const helper: rh.RestApiHelper = new rh.RestApiHelper(baseUrl, runSettings.accessToken);
        
        let reqBody: apiContracts.testRunRequestBody = {} as apiContracts.testRunRequestBody;

        reqBody.name = getTestRunTitle();
        reqBody.plan = {
                  id: runSettings.testPlanId
                };
        reqBody.pointIds = [
                    runSettings.testConfiguration
                ];
        
        let testRunId: number = -1;
        console.log('Creating test run entry.');

        let response: apiContracts.testRunResponse = await helper.createTestRun(reqBody);

        if(response != null)
        {
            testRunId = response.id;
       
            console.log(`Recieved testRunId: ${testRunId}`);

            await uploadTestCaseResults(testRunId, runSettings, helper);

            // TODO: Add logic to upload general attachment
            
            console.log('Updating test run with final outcome.')
            let body: apiContracts.testRunUpdateRequestBody = {} as apiContracts.testRunUpdateRequestBody;

            body.state = getFinalTestResultsOutcome();

            let res: apiContracts.testRunUpdateResponse = await helper.completeTestRun(testRunId, body);

            console.log('Exiting task.');
        }
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
    }
}
async function uploadTestCaseResults(testRunId: number, runSettings: inputContract, helper: rh.RestApiHelper)
{
    var sizeCount: number = 0;
    var testResults:apiContracts.testCaseResult[] = [];

    console.log('Posting testcase results');
    console.log('Testcase mappings count: ' + runSettings.jsonTestCaseMapping.length);
    
    console.log('Start index: ' + runSettings.jsonTestCaseMapping[0]);

    for(var i: number = 0; i < runSettings.jsonTestCaseMapping.length; i++){
        let entry: any = runSettings.jsonTestCaseMapping[i];            
        let passed: boolean = getTestOutcome(entry.className, entry.methodName);
        
        let outcome: apiContracts.testCaseResult =  {
            testPlan: {
                id: runSettings.testPlanId
            },
            testCase: {
                id: parseInt(entry.testCaseId)
            },
            //testCaseRevision: 1,
            testPoint:{
                id: runSettings.testConfiguration
            },
            //priority: 1,
            outcome: (passed ? "Passed" : "Failed")                
        }

        testResults.push(outcome);
        sizeCount++;

        if(i == runSettings.jsonTestCaseMapping.length - 1 || sizeCount >= runSettings.apiBatchSize)
        {
            console.log('Sending batch of test results.');

            let response: apiContracts.testResultResponse = await helper.addTestResults(testRunId, testResults);

            if(response == null)
            {
                throw new Error('Failed to add test results');
            }

            sizeCount = 0;
            testResults = [];
        }        
    }
}
function getTestOutcome(className: string, methodName: string): boolean
{
    // TODO: Add logic to retrieve the test outcome from the available JUnit test results
    return true;
}
function getFinalTestResultsOutcome(): string
{
    return "Aborted";
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
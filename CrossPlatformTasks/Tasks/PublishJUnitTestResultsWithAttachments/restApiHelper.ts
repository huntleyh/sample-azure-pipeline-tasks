import * as rc from 'typed-rest-client/RestClient';
import tl = require('azure-pipelines-task-lib/task');
import * as contracts from './azdoApiContracts';
import * as handlers from 'typed-rest-client/handlers';
import * as httpm from 'typed-rest-client/HttpClient';
import url = require('url');
import typedutil = require("typed-rest-client/Util");
import util from "./taskUtil";

export class RestApiHelper {
    private _baseUrl: string;
    private _rest: rc.RestClient;

    /**
     * Creates an instance of the RestApiHelper to make calls to the Azure DevOps Rest APIs
     * @constructor
     * @param {string} baseUrl - Base Url for requests
     * @param {string} token - Bearer token to be used for authenticating to Azure DevOps
     */
    constructor(baseUrl: string, token: string) {  

        const authenticationHandler: handlers.BearerCredentialHandler  = new handlers.BearerCredentialHandler(token);
        this._baseUrl = baseUrl;

        this._rest = new rc.RestClient('publish-junit-tests-helper', this._baseUrl, [authenticationHandler]);
    }
    
    async getTestPoints(testPlanId: number, testSuiteIds: string[], testConfiguration: number): Promise<number[]> {
        return new Promise<number[]>(async (resolve, reject)=> {
            try
            {
                //GET https://dev.azure.com/{organization}/{project}/_apis/test/Plans/{planId}/Suites/{suiteId}/points?api-version=5.1
                let vals: number[] = [];
                var restRes: rc.IRestResponse<contracts.testPointResponse>;

                for(var i: number = 0; i < testSuiteIds.length; i++)
                {
                    let suiteId: string = testSuiteIds[i];

                    let restRes: rc.IRestResponse<contracts.testPointResponse> = 
                                await this._rest.get<contracts.testPointResponse>('_apis/test/Plans/' + testPlanId + '/Suites/' + suiteId + '/points?configurationId='+ testConfiguration + '&api-version=5.1');

                    
                    if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                    {
                        for(var resIndex: number = 0; resIndex < restRes.result.count; resIndex++)
                            vals.push(restRes.result.value[resIndex].id as number);
                    }
                }
                return resolve(vals);
            }
            catch(exception)
            {
                console.log("Something went wrong retrieving list of test points: " + exception.message);
                reject(exception.message);
            }
        });
    }

    /**
     * Creates a new Test Run with the received detail
     * @param reqBody Request body to be passed in call to the Azure DevOps Service Rest API
     */
    async createTestRun(reqBody: contracts.testRunRequestBody) : Promise<contracts.testRunResponse> {

        return new Promise<contracts.testRunResponse>(async (resolve, reject)=> {
            try
            {
                let restRes: rc.IRestResponse<contracts.testRunResponse> = 
                                    await this._rest.create<contracts.testRunResponse>('_apis/test/runs?api-version=5.1', reqBody);

                console.log(restRes.statusCode);
                console.log(restRes.result);

                if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                {     
                    console.log('Created test run');
                    resolve(restRes.result);
                }
                else
                {
                    console.log('Failed to create test run');
                    if(restRes.statusCode == httpm.HttpCodes.NotFound)
                    {
                        console.log("Please ensure the target URL exists and also the specified test points [" + util.concatArray(reqBody.pointIds) + "] exist.");
                    }
                    if(!restRes.result)
                        reject("Create test run failed: " + restRes.statusCode);
                    else
                    {
                        reject(restRes.result);
                    }
                }
            }
            catch(exception)
            {
                console.log("Something went wrong creating the new test run: " + exception.message);
                reject(exception);
            }
        });
    }
    /**
     * Add test results to a test run
     * @param testRunId The Test Run Id to which the test case results will be added
     * @param testResults An array of test results to be added to the specified [testRunId]
     */
    async addTestResults(testRunId: number, testResults: contracts.testCaseResult[]) : Promise<contracts.testResultResponse> {
        return new Promise<contracts.testResultResponse>(async (resolve, reject)=> {

            try
            {
                let restRes: rc.IRestResponse<contracts.testResultResponse> = 
                                    await this._rest.create<contracts.testResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1', testResults);

                console.log(restRes.statusCode);
                console.log(restRes.result);

                if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                {     
                    console.log('Added test result');
                    resolve(restRes.result);
                }
                else
                {
                    console.log('Failed to add test result');
                    reject(restRes.result);
                }
            }
            catch(exception)
            {
                console.log("Something went wrong adding the test results: " + exception.message);
                reject(exception);
            }
        });
    }
    /**
     * Updates test results to a test run
     * @param testRunId The Test Run Id to which the test case results will be added
     * @param testResults An array of test results to be added to the specified [testRunId]
     */
    async updateTestResults(testRunId: number, testResults: contracts.testCaseResult[]) : Promise<contracts.testResultResponse> {
        return new Promise<contracts.testResultResponse>(async (resolve, reject)=> {

            try
            {
                let restRes: rc.IRestResponse<contracts.testResultResponse> = 
                                    await this._rest.update<contracts.testResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1', testResults);

                console.log(restRes.statusCode);
                console.log(restRes.result);

                if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                {     
                    console.log('Added test result');
                    resolve(restRes.result);
                }
                else
                {
                    console.log('Failed to add test result');
                    reject(restRes.result);
                }
            }
            catch(exception)
            {
                console.log("Something went wrong updating the test results");
                reject(exception);
            }
        });
    }
    /**
     * Get a list of test results to a test run
     * @param testRunId The Test Run Id for which the test results will be retrieved
     */
    async getTestRunResults(testRunId: number) : Promise<contracts.testCaseResult[]> {
        return new Promise<contracts.testCaseResult[]>(async (resolve, reject)=> {
            try
            {
            let restRes: rc.IRestResponse<contracts.testCaseResultResponse> = 
                                await this._rest.get<contracts.testCaseResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1');

            console.log(restRes.statusCode);
            console.log(restRes.result?.value);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {
                console.log('Retrieved test run results');
                resolve(restRes.result.value);
            }
            else
            {
                console.log('Failed to get test run results');
                reject(restRes.result?.value);
            }
            }
            catch(exception)
            {
                console.log("Something went wrong retrieving the test run results: " + exception.message);
                reject(exception);
            }
        });
    }
    /**
     * Update test run by its ID
     * @param testRunId The Test Run Id to be completed
     * @param body Request body to be sent in request.
     */
    async completeTestRun(testRunId: number, body: contracts.testRunUpdateRequestBody): Promise<contracts.testRunUpdateResponse> {
        console.log("Completing testrun " + testRunId);
        return new Promise<contracts.testRunUpdateResponse>(async (resolve, reject)=> {
            try
            {
                let restRes: rc.IRestResponse<contracts.testRunUpdateResponse> = 
                                    await this._rest.update<contracts.testRunUpdateResponse>('_apis/test/Runs/'+testRunId+'?api-version=5.1', body);

                console.log(restRes.statusCode);
                console.log(restRes.result);

                if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                {     
                    console.log('Completed test run');
                    resolve(restRes.result);
                }
                else
                {
                    console.log('Failed to complete test run');
                    reject(restRes.result);
                }
            }
            catch(exception)
            {
                console.log("Something went wrong completing the test run: " + exception.message);
                reject(exception);
            }
        });
    }

    async createTestRunAttachment(testRunId: number, body: contracts.testRunAttachmentRequestBody): Promise<contracts.testRunAttachmentReference> {
        console.log("Completing testrun " + testRunId);
        return new Promise<contracts.testRunAttachmentReference>(async (resolve, reject)=> {
            try
            {
                let restRes: rc.IRestResponse<contracts.testRunAttachmentReference> = 
                                    await this._rest.create<contracts.testRunAttachmentReference>('_apis/test/Runs/'+testRunId+'/attachments?api-version=5.1-preview.1', body);

                console.log(restRes.statusCode);
                console.log(restRes.result);

                if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
                {     
                    console.log('Created test run attachment');
                    resolve(restRes.result);
                }
                else
                {
                    console.log('Failed to create test run attachment');
                    reject(restRes.result);
                }
            }
            catch(exception)
            {
                console.log("Something went wrong creating the test run attachment: " + exception.message);
                reject(exception);
            }
        });
    }
}
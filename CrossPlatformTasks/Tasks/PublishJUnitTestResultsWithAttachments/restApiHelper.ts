import * as rc from 'typed-rest-client/RestClient';
import * as contracts from './azdoApiContracts';
import * as handlers from 'typed-rest-client/handlers';
import * as httpm from 'typed-rest-client/HttpClient';

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

    /**
     * Creates a new Test Run with the received detail
     * @param reqBody Request body to be passed in call to the Azure DevOps Service Rest API
     */
    async createTestRun(reqBody: contracts.testRunRequestBody) : Promise<contracts.testRunResponse> {

        return new Promise<contracts.testRunResponse>(async (resolve, reject)=> {
            let restRes: rc.IRestResponse<contracts.testRunResponse> = 
                                await this._rest.create<contracts.testRunResponse>('_apis/test/runs?api-version=5.1', reqBody);

            console.log(restRes.statusCode);
            console.log(restRes.result);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {     
                console.log('Create test run SUCCESS');
                resolve(restRes.result);
            }
            else
            {
                console.log('Create test run FAILED: ');
                reject(restRes.result);
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

            let restRes: rc.IRestResponse<contracts.testResultResponse> = 
                                await this._rest.create<contracts.testResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1', testResults);

            console.log(restRes.statusCode);
            console.log(restRes.result);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {     
                console.log('Adding test result SUCCESS');
                resolve(restRes.result);
            }
            else
            {
                console.log('Adding test result FAILED: ');
                reject(restRes.result);
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

            let restRes: rc.IRestResponse<contracts.testResultResponse> = 
                                await this._rest.update<contracts.testResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1', testResults);

            console.log(restRes.statusCode);
            console.log(restRes.result);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {     
                console.log('Adding test result SUCCESS');
                resolve(restRes.result);
            }
            else
            {
                console.log('Adding test result FAILED: ');
                reject(restRes.result);
            }
        });
    }
    /**
     * Get a list of test results to a test run
     * @param testRunId The Test Run Id for which the test results will be retrieved
     */
    async getTestRunResults(testRunId: number) : Promise<contracts.testCaseResult[]> {
        return new Promise<contracts.testCaseResult[]>(async (resolve, reject)=> {

            let restRes: rc.IRestResponse<contracts.testCaseResultResponse> = 
                                await this._rest.get<contracts.testCaseResultResponse>('_apis/test/Runs/'+testRunId+'/results?api-version=5.1');

            console.log(restRes.statusCode);
            console.log(restRes.result?.value);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {
                console.log('Get test run results SUCCESS');
                resolve(restRes.result.value);
            }
            else
            {
                console.log('Get test run results FAILED: ');
                reject(restRes.result?.value);
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
            let restRes: rc.IRestResponse<contracts.testRunUpdateResponse> = 
                                await this._rest.create<contracts.testRunUpdateResponse>('_apis/test/Runs/'+testRunId+'?api-version=5.1', body);

            console.log(restRes.statusCode);
            console.log(restRes.result);

            if(restRes.statusCode == httpm.HttpCodes.OK && restRes.result)
            {     
                console.log('Completing test run SUCCESS');
                resolve(restRes.result);
            }
            else
            {
                console.log('Completing test run FAILED: ');
                reject(restRes.result);
            }
        });
    }
}
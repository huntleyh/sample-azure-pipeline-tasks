export interface inputContract
{
    targetType: string;
    jsonTestCaseMappingFile: string;
    inlineJsonTestCaseMapping: string;
    testPlanId: number;
    testSuiteStrings: string[];
    testConfiguration: number;
    generalAttachments: string;
    apiBatchSize: number;
    jsonTestCaseMapping: any;
    organization: string;
    project: string;
    accessToken: string;
    auth: any
}

export interface testResult
{
    testCaseTitle: string;
    outcome: string;
}

export enum TestRunState
{
    NotStarted = 0, 
    InProgress = 1, 
    Completed = 2, 
    Aborted = 3, 
    Waiting = 4
}
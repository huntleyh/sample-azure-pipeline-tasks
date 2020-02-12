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
export interface testRunRequestBody{
    plan: { id: number; };
    pointIds: number[];
    name: string;
    testPlanId: number;
    automated: boolean;
    owner: identityRef;
    build: shallowReference;
    releaseReference: releaseReference;
    releaseUri: string;
    releaseEnvironmentUri: string;
}

export interface shallowReference{
    id: string;
    name: string;
    url: string;
}

export interface releaseReference{
    id: number;
    name: string;
    environmentId: number;
    environmentName: string;
}
export interface identityRef{
    id: string;
    uniqueName: string;
    url: string;
}
export interface testRunUpdateRequestBody{
    state: string;
}

export interface testRunUpdateResponse{
    state: string;
}

export interface testRunResponse{
    id: number;
    name: string;
    url: string;
    plan: { id: number; name: string; };
    revision: number;
    state: string;
}

export interface testResultResponse{
    testPlan: {
        id: number
    };
    testCase: {
        id: number
    };
    //testCaseRevision: 1,
    testPoint:{
        id: number
    };
    //priority: 1,
    outcome: string
}

export interface testCaseResult{
    id: number;
    url: string;
    testPlan: {
        id: number
    };
    testCaseTitle: string;
    testCase: {
        id: number
    };
    testCaseRevision: number,
    testPoint:{
        id: number
    };
    testSuite:{
        id: number
    }
    priority: number,
    outcome: string,
    errorMessage: string,
    failureType: string,
    state: string
}

export interface testCaseResultResponse{
    count: number;
    value: testCaseResult[]
}

export interface testPointResponse{
    count: number;
    value: testPoint[]
}

export interface testPoint{
    id: number;
    url: string;
    outcome: string;
    state: string;
    testCase: testCaseResult;
    configuration: testConfiguration;
}
export interface testConfiguration
{
    id: number;
    name: string;
}
export interface testRunAttachmentRequestBody{
    attachmentType: string;
    comment: string;
    fileName: string;
    stream: string;
}

export interface testRunAttachmentReference{
    id: number;
    url: string;
}
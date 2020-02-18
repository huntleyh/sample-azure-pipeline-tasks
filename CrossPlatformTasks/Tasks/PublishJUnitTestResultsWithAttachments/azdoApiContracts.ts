export interface testRunRequestBody{
    plan: { id: number; };
    pointIds: number[];
    name: string;
    testPlanId: number
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
    state: string
}

export interface testCaseResultResponse{
    count: number;
    value: testCaseResult[]
}
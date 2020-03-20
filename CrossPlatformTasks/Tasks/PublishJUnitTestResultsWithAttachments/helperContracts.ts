export interface inputContract
{
    fullyQualifiedSearch: boolean;
    testPoints: number[];
    testResultsOutputFile: string;
    parsedJUnitTestResults: jUnitTestResultRoot;
    targetType: string;
    jsonTestCaseMappingFile: string;
    inlineJsonTestCaseMapping: string;
    testPlanId: number;
    testSuiteIds: string[];
    testConfiguration: number;
    generalAttachments: string[];
    sourceFolder: string;
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

export interface jUnitTestResultRootGeneric
{
    testsuites: testSuites;
    testsuite: testSuite
}
export interface testSuites
{
    duration: string[];
    testsuite: testSuite[];
}
export interface jUnitTestResultRoot
{
    testsuites: testSuite[];
}
/*export interface testSuite
{
    duration: number[];
    suites: testSuite[];
}
*/
export interface testSuite
{
    name: string[];
    failures: number[];
    package: string[];
    tests: number[];
    time: number[];
    testcase: testCase[];
}

export interface testCase
{
    classname: string[];
    name: string[];
    time: number[];
    error: error[];
    ignored: ignored[];
    failure: failure[];
    skipped: skipped[];
    comparisonClassName: string;
}

export interface ignored
{
    message: string[];
    type: string[]
}

export interface error
{
    message: string[];
    type: string[]
}

export interface failure
{
    message: string[];
    type: string[]
}

export interface skipped
{
    message: string[];
    type: string[]
}
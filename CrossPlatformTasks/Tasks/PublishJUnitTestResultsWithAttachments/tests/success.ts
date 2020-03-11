import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'publishjunittestresults.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

let testPath: string = "C:\\GitHubRepos\\simplefiles";

console.log("Starting test");
tmr.setInput('targetType', 'filePath');//'inline');
tmr.setInput('jsonTestCaseMappingFile', '\\tests\\sample-files\\testcase-mapping.json');
tmr.setInput('inlineJsonTestCaseMapping', '[{"className": "main.java.com.Tests.USB_VB_iOSBrowser_LogInToApp","methodName": "LoginToTheApp","testCaseId": 951, "testSuiteId": 950}]');
tmr.setInput('testPlan', '899');
tmr.setInput('testSuite', '942'); //'87,98');
tmr.setInput('testConfiguration', '25'); //'212');
tmr.setInput('generalAttachments', '**/*.html\n**/*.txt\n**/*.jpg');
tmr.setInput('sourceFolder', path.normalize(testPath));
tmr.setInput('testResultsOutputFile','C:\\GitHubRepos\\simplefiles\\JUnitTestResult\\test-result.xml');//'C:\\GitHubRepos\\sample-azure-pipeline-tasks\\CrossPlatformTasks\\Tasks\\PublishJUnitTestResultsWithAttachments\\tests\\sample-files\\TEST-Multiple.xml');//'C:\\GitHubRepos\\simplefiles\\JUnitTestResult\\TEST-main.java.com.Tests.DMA_Smoke_SimpleLogin.xml')
let answers: ma.TaskLibAnswers = {} as ma.TaskLibAnswers;

answers.checkPath = { };
answers.find = { };

answers.checkPath[path.normalize(testPath)] = true;
answers.find[path.normalize(testPath)] = [
    path.normalize(testPath),
    path.normalize(testPath + "\\Restless.jpg"),
    path.normalize(testPath + "\\simple.txt"),
    path.normalize(testPath + "\\Restless.jpg"),
    path.normalize(testPath + "\\somehtmp.html")
];
tmr.setAnswers(answers);
tmr.registerMockExport('stats', (itemPath: string) => {
    console.log('##vso[task.debug]stats ' + itemPath);
    switch (itemPath) {
        case path.normalize(testPath):
            return { isDirectory: () => true };
        case path.normalize(testPath + "\\Restless.jpg"):
        case path.normalize(testPath + "\\simple.txt"):
        case path.normalize(testPath + "\\Restless.jpg"):
        case path.normalize(testPath + "\\somehtmp.html"):
            return { isDirectory: () => false };
        default:
            throw { code: 'ENOENT' };
    }
});

tmr.run();


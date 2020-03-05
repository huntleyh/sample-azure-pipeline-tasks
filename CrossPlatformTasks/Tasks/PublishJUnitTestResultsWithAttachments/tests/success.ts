import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'publishjunittestresults.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

console.log("Starting test");
tmr.setInput('targetType', 'inline');
tmr.setInput('jsonTestCaseMappingFile', '');
tmr.setInput('inlineJsonTestCaseMapping', '[{"className": "main.java.com.Tests.USB_VB_iOSBrowser_LogInToApp","methodName": "LoginToTheApp","testCaseId": 951, "testSuiteId": 950}]');
tmr.setInput('testPlan', '899');
tmr.setInput('testSuite', '87,98');
tmr.setInput('testConfiguration', '212');
tmr.setInput('generalAttachments', '**/*.html\n**/*.txt\n**/*.jpg');
tmr.setInput('sourceFolder', 'C:\\GitHubRepos\\simplefiles\\');
tmr.setInput('testResultsOutputFile','C:\\GitHubRepos\\simplefiles\\JUnitTestResult\\TEST-main.java.com.Tests.DMA_Smoke_SimpleLogin.xml')
let answers: ma.TaskLibAnswers = {} as ma.TaskLibAnswers;

answers.checkPath = { };
answers.find = { };

let testPath: string = "C:\\GitHubRepos\\simplefiles";
answers.checkPath[path.normalize(testPath)] = true;
answers.find[testPath] = [
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


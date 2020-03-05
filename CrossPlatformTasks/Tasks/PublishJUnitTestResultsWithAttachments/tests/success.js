"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tmrm = require("azure-pipelines-task-lib/mock-run");
var path = require("path");
var taskPath = path.join(__dirname, '..', 'publishjunittestresults.js');
var tmr = new tmrm.TaskMockRunner(taskPath);
console.log("Starting test");
tmr.setInput('targetType', 'inline');
tmr.setInput('jsonTestCaseMappingFile', '');
tmr.setInput('inlineJsonTestCaseMapping', '[{"className": "main.java.com.Tests.USB_VB_iOSBrowser_LogInToApp","methodName": "LoginToTheApp","testCaseId": 951, "testSuiteId": 950}]');
tmr.setInput('testPlan', '899');
tmr.setInput('testSuite', '87,98');
tmr.setInput('testConfiguration', '212');
tmr.setInput('generalAttachments', '**/*.html\n**/*.txt\n**/*.jpg');
tmr.setInput('sourceFolder', 'C:\\GitHubRepos\\simplefiles\\');
tmr.setInput('testResultsOutputFile', 'C:\\GitHubRepos\\simplefiles\\JUnitTestResult\\TEST-main.java.com.Tests.DMA_Smoke_SimpleLogin.xml');
var answers = {};
answers.checkPath = {};
answers.find = {};
var testPath = "C:\\GitHubRepos\\simplefiles";
answers.checkPath[path.normalize(testPath)] = true;
answers.find[testPath] = [
    path.normalize(testPath),
    path.normalize(testPath + "\\Restless.jpg"),
    path.normalize(testPath + "\\simple.txt"),
    path.normalize(testPath + "\\Restless.jpg"),
    path.normalize(testPath + "\\somehtmp.html")
];
tmr.setAnswers(answers);
tmr.registerMockExport('stats', function (itemPath) {
    console.log('##vso[task.debug]stats ' + itemPath);
    switch (itemPath) {
        case path.normalize(testPath):
            return { isDirectory: function () { return true; } };
        case path.normalize(testPath + "\\Restless.jpg"):
        case path.normalize(testPath + "\\simple.txt"):
        case path.normalize(testPath + "\\Restless.jpg"):
        case path.normalize(testPath + "\\somehtmp.html"):
            return { isDirectory: function () { return false; } };
        default:
            throw { code: 'ENOENT' };
    }
});
tmr.run();
//# sourceMappingURL=success.js.map
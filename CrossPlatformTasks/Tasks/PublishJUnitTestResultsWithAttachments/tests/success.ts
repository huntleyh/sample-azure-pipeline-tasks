import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'publishjunittestresults.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('targetType', 'inline');
tmr.setInput('jsonTestCaseMappingFile', '');
tmr.setInput('inlineJsonTestCaseMapping', '[{"className": "HelloWorldJava.Demo.HelloWorldJunitTest","methodName": "testTrue","testCaseId": 951, "testSuiteId": 950}]');
tmr.setInput('testPlan', '899');
tmr.setInput('testSuite', '87,98');
tmr.setInput('testConfiguration', '212');
tmr.setInput('generalAttachments', '');

tmr.run();


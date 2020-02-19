"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tmrm = require("azure-pipelines-task-lib/mock-run");
var path = require("path");
var taskPath = path.join(__dirname, '..', 'publishjunittestresults.js');
var tmr = new tmrm.TaskMockRunner(taskPath);
tmr.setInput('targetType', 'inline');
tmr.setInput('jsonTestCaseMappingFile', '');
tmr.setInput('inlineJsonTestCaseMapping', '[{"className": "HelloWorldJava.Demo.HelloWorldJunitTest","methodName": "testTrue","testCaseId": 951, "testSuiteId": 950}]');
tmr.setInput('testPlan', '899');
tmr.setInput('testSuite', '87,98');
tmr.setInput('testConfiguration', '212');
tmr.setInput('generalAttachments', '');
tmr.run();
//# sourceMappingURL=success.js.map
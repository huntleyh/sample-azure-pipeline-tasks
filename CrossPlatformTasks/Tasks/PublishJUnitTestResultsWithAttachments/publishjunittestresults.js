"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var tl = require("azure-pipelines-task-lib/task");
var path = require("path");
var fs = require("fs");
var util = require("util");
var rh = __importStar(require("./restApiHelper"));
require('util.promisify').shim();
var request = require('request');
require('request').debug = true;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var runSettings, jsonMapping, baseUrl, helper, reqBody, testRunId, response, body, res, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    tl.setResourcePath(path.join(__dirname, 'task.json'));
                    runSettings = {};
                    runSettings.targetType = tl.getInput('targetType', true);
                    runSettings.jsonTestCaseMappingFile = tl.getPathInput('jsonTestCaseMappingFile', (runSettings.targetType == 'filePath') ? true : false);
                    runSettings.inlineJsonTestCaseMapping = tl.getInput('inlineJsonTestCaseMapping', (runSettings.targetType == 'inline') ? true : false);
                    runSettings.testPlanId = parseInt("" + tl.getInput('testPlan', true));
                    runSettings.testSuiteStrings = tl.getDelimitedInput('testSuite', ',', true);
                    runSettings.testConfiguration = parseInt("" + tl.getInput('testConfiguration', true));
                    runSettings.generalAttachments = tl.getInput('generalAttachments', false);
                    runSettings.apiBatchSize = (tl.getVariable('JUnitTestCase.BatchSize') && tl.getVariable('JUnitTestCase.BatchSize') != '' ? parseInt("" + tl.getVariable('JUnitTestCase.BatchSize')) : 20);
                    jsonMapping = getTestCaseJsonMapping("" + runSettings.targetType, "" + runSettings.jsonTestCaseMappingFile, "" + runSettings.inlineJsonTestCaseMapping);
                    console.log("Parsing JSON mapping: " + jsonMapping);
                    runSettings.jsonTestCaseMapping = JSON.parse(jsonMapping);
                    runSettings.organization = "" + tl.getVariable('System.TeamFoundationCollectionUri');
                    runSettings.project = "" + tl.getVariable('System.TeamProject');
                    runSettings.accessToken = "" + tl.getVariable('System.AccessToken');
                    baseUrl = runSettings.organization + "/" + runSettings.project;
                    helper = new rh.RestApiHelper(baseUrl, runSettings.accessToken);
                    reqBody = {};
                    reqBody.name = getTestRunTitle();
                    reqBody.plan = {
                        id: runSettings.testPlanId
                    };
                    reqBody.pointIds = [
                        runSettings.testConfiguration
                    ];
                    testRunId = -1;
                    console.log('Creating test run entry.');
                    return [4 /*yield*/, helper.createTestRun(reqBody)];
                case 1:
                    response = _a.sent();
                    if (!(response != null)) return [3 /*break*/, 4];
                    testRunId = response.id;
                    console.log("Recieved testRunId: " + testRunId);
                    return [4 /*yield*/, uploadTestCaseResults(testRunId, runSettings, helper)];
                case 2:
                    _a.sent();
                    console.log('Updating test run with final outcome.');
                    body = {};
                    body.state = getFinalTestResultsOutcome();
                    return [4 /*yield*/, helper.completeTestRun(testRunId, body)];
                case 3:
                    res = _a.sent();
                    console.log('Exiting task.');
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message || 'run() failed');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function uploadTestCaseResults(testRunId, runSettings, helper) {
    return __awaiter(this, void 0, void 0, function () {
        var sizeCount, testResults, i, entry, passed, outcome, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sizeCount = 0;
                    testResults = [];
                    console.log('Posting testcase results');
                    console.log('Testcase mappings count: ' + runSettings.jsonTestCaseMapping.length);
                    console.log('Start index: ' + runSettings.jsonTestCaseMapping[0]);
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < runSettings.jsonTestCaseMapping.length)) return [3 /*break*/, 4];
                    entry = runSettings.jsonTestCaseMapping[i];
                    passed = getTestOutcome(entry.className, entry.methodName);
                    outcome = {
                        testPlan: {
                            id: runSettings.testPlanId
                        },
                        testCase: {
                            id: parseInt(entry.testCaseId)
                        },
                        //testCaseRevision: 1,
                        testPoint: {
                            id: runSettings.testConfiguration
                        },
                        //priority: 1,
                        outcome: (passed ? "Passed" : "Failed")
                    };
                    testResults.push(outcome);
                    sizeCount++;
                    if (!(i == runSettings.jsonTestCaseMapping.length - 1 || sizeCount >= runSettings.apiBatchSize)) return [3 /*break*/, 3];
                    console.log('Sending batch of test results.');
                    return [4 /*yield*/, helper.addTestResults(testRunId, testResults)];
                case 2:
                    response = _a.sent();
                    if (response == null) {
                        throw new Error('Failed to add test results');
                    }
                    /*
                    await request.post({uri: uri, auth: runSettings.auth, json: true, body: JSON.stringify(testResults)},
                        function (error: any, response: { statusCode: number; }, body: any) {
                            console.log('body:', body);
        
                            if(response.statusCode != 200)
                            {
                                tl.setResult(tl.TaskResult.Failed, error.message || 'Update test result failed', true);
                                return;
                            }
                        }
                    );
                    */
                    sizeCount = 0;
                    testResults = [];
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getTestOutcome(className, methodName) {
    return true;
}
function getFinalTestResultsOutcome() {
    return "Aborted";
}
function getTestRunTitle() {
    console.log('Generating test run title.');
    var definitionName = tl.getVariable('BUILD_DEFINITIONNAME');
    var buildOrReleaseName = tl.getVariable('BUILD_BUILDNUMBER');
    if (tl.getVariable('Release.ReleaseUri') && tl.getVariable('Release.ReleaseUri') != '') {
        definitionName = tl.getVariable('RELEASE_DEFINITIONNAME');
        buildOrReleaseName = tl.getVariable('RELEASE_RELEASENAME');
    }
    return "TestRun_" + definitionName + "_" + buildOrReleaseName;
}
function getTestCaseJsonMapping(targetType, mappingFile, inlineJson) {
    var jsonMapping = '';
    if (targetType == 'filePath') {
        console.log('Retrieving json mapping file content.');
        var filePath_1 = path.join(__dirname, "" + mappingFile);
        var fileExists = util.promisify(fs.exists);
        var readFileContents_1 = util.promisify(fs.readFile);
        fileExists(filePath_1)
            .then(function (exists) {
            if (exists == true) {
                console.log('File found.');
                readFileContents_1(filePath_1, 'utf-8')
                    .then(function (text) {
                    jsonMapping = text;
                })
                    .catch(function (err) {
                    console.error("Could not read specified mapping file '" + filePath_1 + "': " + err);
                });
            }
            else {
                console.error("Failed to locate specified mapping file '" + filePath_1 + "'");
            }
        })
            .catch(function (err) {
            console.error("Failed to locate specified mapping file '" + filePath_1 + "': " + err);
        });
    }
    else {
        jsonMapping = "" + inlineJson;
    }
    return jsonMapping;
}
run();

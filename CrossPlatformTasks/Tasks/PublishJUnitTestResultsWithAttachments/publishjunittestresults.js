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
var helperContracts = __importStar(require("./helperContracts"));
var rh = __importStar(require("./restApiHelper"));
require('util.promisify').shim();
var request = require('request');
require('request').debug = true;
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var runSettings, jsonMapping, baseUrl, helper, reqBody, testRunId, response, outcome, body, err_1, body, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
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
                    if (!(response != null)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 7]);
                    testRunId = response.id;
                    console.log("Recieved testRunId: " + testRunId);
                    return [4 /*yield*/, uploadTestCaseResults(testRunId, runSettings, helper)];
                case 3:
                    outcome = _a.sent();
                    // TODO: Add logic to upload general attachment
                    console.log('Updating test run with final outcome.');
                    body = {};
                    body.state = getFinalTestResultsOutcome(outcome);
                    console.log('Updating test run status to ' + body.state);
                    return [4 /*yield*/, helper.completeTestRun(testRunId, body)];
                case 4:
                    _a.sent();
                    console.log('Exiting task.');
                    return [3 /*break*/, 7];
                case 5:
                    err_1 = _a.sent();
                    body = {};
                    body.state = "Aborted";
                    return [4 /*yield*/, helper.completeTestRun(testRunId, body)];
                case 6:
                    _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message || 'run() failed');
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    err_2 = _a.sent();
                    tl.setResult(tl.TaskResult.Failed, err_2.message || 'run() failed');
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function uploadTestCaseResults(testRunId, runSettings, helper) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var sizeCount, finalOutcome, testResults, testRunExistingResults, i, entry, testResult, existingRecord, outcome, response;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                sizeCount = 0;
                                finalOutcome = helperContracts.TestRunState.Completed;
                                testResults = [];
                                return [4 /*yield*/, helper.getTestRunResults(testRunId)];
                            case 1:
                                testRunExistingResults = _a.sent();
                                //TODO: Index the results to improve performance
                                //var indexedTestRunResults = indexExistingResults(testRunExistingResults);
                                console.log('Retrieved ' + testRunExistingResults.length + ' existing results');
                                console.log('Posting testcase results');
                                console.log('Testcase mappings count: ' + runSettings.jsonTestCaseMapping.length);
                                i = 0;
                                _a.label = 2;
                            case 2:
                                if (!(i < runSettings.jsonTestCaseMapping.length)) return [3 /*break*/, 5];
                                entry = runSettings.jsonTestCaseMapping[i];
                                console.log("Retrieving the JUnit test result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                                testResult = getJUnitTestResult(entry.className, entry.methodName);
                                console.log("Retrieving existing test run result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                                existingRecord = getTargetTestResult(parseInt(entry.testCaseId), parseInt(entry.testSuiteId), testRunExistingResults);
                                //TODO
                                //let existingRecord: apiContracts.testCaseResult = indexedTestRunResults[entry.testCaseId][entry.testSuiteId];
                                /*let outcome: apiContracts.testCaseResult =  {
                                    testPlan: {
                                        id: runSettings.testPlanId
                                    },
                                    testCaseTitle: testResult.testCaseTitle,
                                    testCase: {
                                        id: parseInt(entry.testCaseId)
                                    },
                                    testCaseRevision: 1,
                                    testPoint:{
                                        id: runSettings.testConfiguration
                                    },
                                    priority: 1,
                                    outcome: (testResult.outcome ? "Passed" : "Failed")
                                }*/
                                if (existingRecord) {
                                    outcome = {};
                                    outcome.id = existingRecord.id;
                                    outcome.outcome = (testResult.outcome ? "Passed" : "Failed");
                                    outcome.state = "Completed";
                                    testResults.push(outcome);
                                }
                                sizeCount++;
                                if (!(testResults.length > 0 && (i == runSettings.jsonTestCaseMapping.length - 1 || sizeCount >= runSettings.apiBatchSize))) return [3 /*break*/, 4];
                                console.log('Sending batch of test results.');
                                return [4 /*yield*/, helper.updateTestResults(testRunId, testResults)];
                            case 3:
                                response = _a.sent();
                                if (response == null) {
                                    throw new Error('Failed to add test results');
                                }
                                sizeCount = 0;
                                testResults = [];
                                _a.label = 4;
                            case 4:
                                i++;
                                return [3 /*break*/, 2];
                            case 5:
                                resolve(finalOutcome);
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function getTargetTestResult(testCaseId, testSuiteId, existingTestResults) {
    for (var i = 0; i < existingTestResults.length; i++) {
        console.log("Checking entry with " + existingTestResults[i].testCase.id + " suite id " + existingTestResults[i].testSuite.id);
        if (existingTestResults[i].testCase.id == testCaseId && existingTestResults[i].testSuite.id == testSuiteId) {
            console.log("Found matching test result for test case " + testCaseId + " and suite " + testSuiteId);
            return existingTestResults[i];
        }
    }
    console.log("No matching test result found for testCaseId" + testCaseId + "/ testSuiteId " + testSuiteId + ".\n Please check the specified testCaseId and testSuiteId in your JSON mapping");
    return null;
}
/**
 * Index the collection of test case results to minimize time spent iterating over the list for each test case
 * @param existingTestResults
 */
function indexExistingResults(existingTestResults) {
    var indexedTestCaseResults = {};
    console.log("Indexing test case results");
    for (var i = 0; i < existingTestResults.length; i++) {
        var entry = existingTestResults[i];
        console.log("Checking for entry test case id: " + entry.testCase.id);
        if (!indexedTestCaseResults[entry.testCase.id]) {
            try {
                console.log("Test case id: " + entry.testCase.id + " does not exist. Creating new entry.");
                indexedTestCaseResults[entry.testCase.id] = [];
            }
            catch (error) {
                console.log(error);
            }
        }
        console.log("Assigning entry to the test suite id: " + entry.testSuite.id);
        indexedTestCaseResults[entry.testCase.id][entry.testSuite.id] = entry;
    }
    console.log("Returning indexed results");
    return indexedTestCaseResults;
}
function getJUnitTestResult(className, methodName) {
    // TODO: Add logic to retrieve the test outcome from the available JUnit test results
    var result = {};
    result.testCaseTitle = "Login to the app";
    result.outcome = "Passed";
    return result;
}
function getFinalTestResultsOutcome(outcome) {
    switch (outcome) {
        case helperContracts.TestRunState.Aborted:
            return "Aborted";
        case helperContracts.TestRunState.Completed:
            return "Completed";
        case helperContracts.TestRunState.InProgress:
            return "InProgress";
        case helperContracts.TestRunState.NotStarted:
            return "NotStarted";
        case helperContracts.TestRunState.Waiting:
            return "Waiting";
        default:
            return "Aborted";
    }
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

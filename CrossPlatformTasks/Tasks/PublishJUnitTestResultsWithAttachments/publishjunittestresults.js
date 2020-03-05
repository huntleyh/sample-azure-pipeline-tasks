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
//import { match } from 'assert';
var xml2js = require('xml2js');
require('util.promisify').shim();
//var request = require('request');
//require('request').debug = true
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var runSettings, jsonMapping, _a, baseUrl, helper, reqBody, testRunId, response, outcome, body, err_1, body, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 10, , 11]);
                    tl.setResourcePath(path.join(__dirname, 'task.json'));
                    runSettings = {};
                    runSettings.targetType = tl.getInput('targetType', true);
                    runSettings.jsonTestCaseMappingFile = tl.getPathInput('jsonTestCaseMappingFile', (runSettings.targetType == 'filePath') ? true : false);
                    runSettings.inlineJsonTestCaseMapping = tl.getInput('inlineJsonTestCaseMapping', (runSettings.targetType == 'inline') ? true : false);
                    runSettings.testPlanId = parseInt("" + tl.getInput('testPlan', true));
                    runSettings.testSuiteStrings = tl.getDelimitedInput('testSuite', ',', true);
                    runSettings.testConfiguration = parseInt("" + tl.getInput('testConfiguration', true));
                    runSettings.testResultsOutputFile = tl.getInput('testResultsOutputFile', true);
                    runSettings.generalAttachments = tl.getDelimitedInput('generalAttachments', '\n', false);
                    runSettings.sourceFolder = getStringValue(tl.getPathInput('sourceFolder', true, false));
                    runSettings.apiBatchSize = (tl.getVariable('JUnitTestCase.BatchSize') && tl.getVariable('JUnitTestCase.BatchSize') != '' ? parseInt("" + tl.getVariable('JUnitTestCase.BatchSize')) : 20);
                    jsonMapping = getTestCaseJsonMapping("" + runSettings.targetType, "" + runSettings.jsonTestCaseMappingFile, "" + runSettings.inlineJsonTestCaseMapping);
                    console.log("Parsing JSON mapping: " + jsonMapping);
                    runSettings.jsonTestCaseMapping = JSON.parse(jsonMapping);
                    console.log("Parsing JUnit Test Results file: " + runSettings.testResultsOutputFile);
                    _a = runSettings;
                    return [4 /*yield*/, parseJUnitTestResultsFile(runSettings.testResultsOutputFile)];
                case 1:
                    _a.parsedJUnitTestResults = _b.sent();
                    runSettings.organization = "" + tl.getVariable('System.TeamFoundationCollectionUri');
                    runSettings.project = "" + tl.getVariable('System.TeamProject');
                    runSettings.accessToken = "" + tl.getVariable('System.AccessToken');
                    baseUrl = runSettings.organization + "/" + runSettings.project;
                    helper = new rh.RestApiHelper(baseUrl, runSettings.accessToken);
                    reqBody = getTestRunRequestBody(runSettings);
                    testRunId = -1;
                    console.log('Creating test run entry.');
                    return [4 /*yield*/, helper.createTestRun(reqBody)];
                case 2:
                    response = _b.sent();
                    if (!(response != null)) return [3 /*break*/, 9];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 7, , 9]);
                    testRunId = response.id;
                    console.log("Recieved testRunId: " + testRunId);
                    return [4 /*yield*/, uploadTestCaseResults(testRunId, runSettings, helper)];
                case 4:
                    outcome = _b.sent();
                    // TODO: Add logic to upload general attachment
                    return [4 /*yield*/, uploadGeneralAttachments(testRunId, runSettings, helper)];
                case 5:
                    // TODO: Add logic to upload general attachment
                    _b.sent();
                    console.log('Updating test run with final outcome.');
                    body = {};
                    body.state = getFinalTestResultsOutcome(outcome);
                    console.log('Updating test run status to ' + body.state);
                    return [4 /*yield*/, helper.completeTestRun(testRunId, body)];
                case 6:
                    _b.sent();
                    console.log('Exiting task.');
                    return [3 /*break*/, 9];
                case 7:
                    err_1 = _b.sent();
                    body = {};
                    body.state = "Aborted";
                    return [4 /*yield*/, helper.completeTestRun(testRunId, body)];
                case 8:
                    _b.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message || 'run() failed');
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 11];
                case 10:
                    err_2 = _b.sent();
                    if (err_2) {
                        tl.setResult(tl.TaskResult.Failed, err_2.message || 'run() failed', true);
                    }
                    else {
                        tl.setResult(tl.TaskResult.Failed, "Task failed", true);
                    }
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 *
 * @param filePath path to the JUnit test results file
 */
function parseJUnitTestResultsFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var contents, parser, result, obj, root, err_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                console.log('Reading JUnit test results XML');
                                contents = fs.readFileSync(filePath, 'utf8');
                                parser = new xml2js.Parser({ mergeAttrs: true });
                                return [4 /*yield*/, parser.parseStringPromise(contents)];
                            case 1:
                                result = _a.sent();
                                console.log('Parsing XML to JS');
                                obj = JSON.stringify(result);
                                root = JSON.parse(obj);
                                console.log('Returning converted test suites results');
                                resolve(root);
                                return [3 /*break*/, 3];
                            case 2:
                                err_3 = _a.sent();
                                console.log("Failed to parse JUnit XML results file: " + err_3.message);
                                reject(err_3.message);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
/**
 * Return the string value of the provide val parameter or null
 * @param val
 */
function getStringValue(val) {
    if (!val)
        return "";
    else
        return val.valueOf();
}
/**
 * Create the request body to be used in creating the new test run
 * @param settings runSettings for the execution of the task
 */
function getTestRunRequestBody(settings) {
    var body = {};
    body.name = getTestRunTitle();
    body.automated = true;
    body.plan = {
        id: settings.testPlanId
    };
    body.pointIds = [
        settings.testConfiguration
    ];
    return body;
}
function uploadGeneralAttachments(testRunId, runSettings, helper) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var sourceFolder, allPaths, sourceFolderPattern, matchedPaths, matchedFiles, i, file, request, response, err_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 6, , 7]);
                                sourceFolder = path.normalize(runSettings.sourceFolder);
                                allPaths = tl.find(sourceFolder);
                                sourceFolderPattern = sourceFolder.replace('[', '[[]');
                                matchedPaths = tl.match(allPaths, runSettings.generalAttachments, sourceFolderPattern);
                                matchedFiles = matchedPaths.filter(function (itemPath) { return !tl.stats(itemPath).isDirectory(); });
                                // copy the files to the target folder
                                console.log(tl.loc('FoundNFiles', matchedFiles.length));
                                if (!(matchedFiles.length > 0)) return [3 /*break*/, 5];
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < matchedFiles.length)) return [3 /*break*/, 4];
                                file = matchedFiles[i];
                                request = {};
                                request.attachmentType = "GeneralAttachment";
                                request.fileName = path.basename(file);
                                request.stream = fs.readFileSync(file, 'utf8');
                                return [4 /*yield*/, helper.createTestRunAttachment(testRunId, request)];
                            case 2:
                                response = _a.sent();
                                if (response == null) {
                                    throw new Error('Failed to add test results');
                                }
                                _a.label = 3;
                            case 3:
                                i++;
                                return [3 /*break*/, 1];
                            case 4:
                                ;
                                _a.label = 5;
                            case 5:
                                resolve("success");
                                return [3 /*break*/, 7];
                            case 6:
                                err_4 = _a.sent();
                                console.log("Unable to update test case results" + err_4.message);
                                reject(err_4.message);
                                return [3 /*break*/, 7];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function uploadTestCaseResults(testRunId, runSettings, helper) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var sizeCount, finalOutcome, testResults, testRunExistingResults, i, entry, testResult, existingRecord, outcome, response, err_5;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 6, , 7]);
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
                                testResult = getJUnitTestResult(runSettings.parsedJUnitTestResults, entry.className, entry.methodName);
                                console.log("Retrieving existing test run result for test case " + entry.testCaseId + " with testSuiteId " + entry.testSuiteId);
                                existingRecord = getTargetTestResult(parseInt(entry.testCaseId), parseInt(entry.testSuiteId), testRunExistingResults);
                                console.log("Retrieved " + existingRecord);
                                //TODO
                                //let existingRecord: apiContracts.testCaseResult = indexedTestRunResults[entry.testCaseId][entry.testSuiteId];
                                if (existingRecord) {
                                    outcome = {};
                                    outcome.id = existingRecord.id;
                                    outcome.outcome = (testResult ? testResult.outcome : "Not Applicable");
                                    outcome.errorMessage = (testResult ? testResult.errorMessage : "");
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
                                return [3 /*break*/, 7];
                            case 6:
                                err_5 = _a.sent();
                                console.log("Unable to update test case results" + err_5.message);
                                reject(err_5.message);
                                return [3 /*break*/, 7];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
function getTargetTestResult(testCaseId, testSuiteId, existingTestResults) {
    var _a, _b;
    console.log("Recieved test case: " + testCaseId + " and suite: " + testSuiteId + " with existing results: " + existingTestResults.length);
    var emptyResult = {};
    for (var index = 0; index < existingTestResults.length; index++) {
        console.log("inside loop");
        var entry = existingTestResults[index];
        console.log("Entry is " + entry);
        console.log("TestCase is " + entry.testCase);
        console.log("Checking entry with " + existingTestResults[index].testCase.id + " suite id " + ((_b = (_a = existingTestResults[index]) === null || _a === void 0 ? void 0 : _a.testSuite) === null || _b === void 0 ? void 0 : _b.id));
        if (existingTestResults[index].testCase.id == testCaseId && (!existingTestResults[index].testSuite || (existingTestResults[index].testSuite && existingTestResults[index].testSuite.id == testSuiteId))) {
            console.log("Found matching test result for test case " + testCaseId + " and suite " + testSuiteId);
            return existingTestResults[index];
        }
    }
    console.log("No matching test result found for testCaseId" + testCaseId + "/ testSuiteId " + testSuiteId + ".\n Please check the specified testCaseId and testSuiteId in your JSON mapping");
    return emptyResult;
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
function getJUnitTestResult(parsedJUnitTestResults, className, methodName) {
    //for(var s: number = 0; s < parsedJUnitTestResults.testsuite; s++)
    //{
    var suite = parsedJUnitTestResults.testsuite;
    if (suite.testcase) {
        for (var t = 0; t < suite.testcase.length; t++) {
            var testCase = suite.testcase[t];
            if (stringIsEqual(testCase.classname, className) && stringIsEqual(testCase.name, methodName)) {
                return parsedTestCaseResult(testCase);
            }
        }
    }
    //}
    return null;
}
function parsedTestCaseResult(testCase) {
    try {
        var result = {};
        result.testCaseTitle = testCase.name[0];
        if (isEmptyArray(testCase.failure) && isEmptyArray(testCase.skipped) && isEmptyArray(testCase.error)) {
            result.outcome = "Passed";
        }
        else if (!isEmptyArray(testCase.failure)) {
            result.outcome = "Failed";
            result.errorMessage = squashArray(testCase.failure);
        }
        else if (!isEmptyArray(testCase.skipped)) {
            result.outcome = "Failed";
            result.errorMessage = squashArray(testCase.skipped);
        }
        else if (!isEmptyArray(testCase.error)) {
            result.outcome = "Failed";
            result.errorMessage = squashArray(testCase.error);
        }
        return result;
    }
    catch (err) {
        console.log("Failed to parse test case result from input: " + err.message);
    }
    return null;
}
function squashArray(values, propName) {
    if (propName === void 0) { propName = "message"; }
    var val = "";
    if (values) {
        for (var i = 0; i < values.length; i++) {
            val = val + ("" + concatArray(values[i].propName));
        }
    }
    return val;
}
function concatArray(values, lineBreak) {
    if (lineBreak === void 0) { lineBreak = ";"; }
    var val = "";
    if (values) {
        for (var i = 0; i < values.length; i++) {
            if (i > 0)
                val = val + lineBreak;
            val = val + ("" + values[i]);
        }
    }
    return val;
}
function isEmptyArray(values) {
    if (values && values.length > 0)
        return false;
    return true;
}
function stringIsEqual(values, search) {
    for (var i = 0; i < values.length; i++) {
        if (values[i] == search)
            return true;
    }
    return false;
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
//# sourceMappingURL=publishjunittestresults.js.map
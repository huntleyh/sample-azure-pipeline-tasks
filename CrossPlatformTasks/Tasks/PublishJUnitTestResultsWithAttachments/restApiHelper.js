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
var rc = __importStar(require("typed-rest-client/RestClient"));
var handlers = __importStar(require("typed-rest-client/handlers"));
var httpm = __importStar(require("typed-rest-client/HttpClient"));
var RestApiHelper = /** @class */ (function () {
    /**
     * Creates an instance of the RestApiHelper to make calls to the Azure DevOps Rest APIs
     * @constructor
     * @param {string} baseUrl - Base Url for requests
     * @param {string} token - Bearer token to be used for authenticating to Azure DevOps
     */
    function RestApiHelper(baseUrl, token) {
        var authenticationHandler = new handlers.BearerCredentialHandler(token);
        this._baseUrl = baseUrl;
        this._rest = new rc.RestClient('publish-junit-tests-helper', this._baseUrl, [authenticationHandler]);
    }
    /**
     * Creates a new Test Run with the received detail
     * @param reqBody Request body to be passed in call to the Azure DevOps Service Rest API
     */
    RestApiHelper.prototype.createTestRun = function (reqBody) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var restRes, exception_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, this._rest.create('_apis/test/runs?api-version=5.1', reqBody)];
                                case 1:
                                    restRes = _a.sent();
                                    console.log(restRes.statusCode);
                                    console.log(restRes.result);
                                    if (restRes.statusCode == httpm.HttpCodes.OK && restRes.result) {
                                        console.log('Create test run SUCCESS');
                                        resolve(restRes.result);
                                    }
                                    else {
                                        console.log('Create test run FAILED: ');
                                        reject(restRes.result);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    exception_1 = _a.sent();
                                    console.log("Something went wrong creating the new test run: " + exception_1.message);
                                    reject(exception_1.message);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Add test results to a test run
     * @param testRunId The Test Run Id to which the test case results will be added
     * @param testResults An array of test results to be added to the specified [testRunId]
     */
    RestApiHelper.prototype.addTestResults = function (testRunId, testResults) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var restRes, exception_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, this._rest.create('_apis/test/Runs/' + testRunId + '/results?api-version=5.1', testResults)];
                                case 1:
                                    restRes = _a.sent();
                                    console.log(restRes.statusCode);
                                    console.log(restRes.result);
                                    if (restRes.statusCode == httpm.HttpCodes.OK && restRes.result) {
                                        console.log('Adding test result SUCCESS');
                                        resolve(restRes.result);
                                    }
                                    else {
                                        console.log('Adding test result FAILED: ');
                                        reject(restRes.result);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    exception_2 = _a.sent();
                                    console.log("Something went wrong adding the test results: " + exception_2.message);
                                    reject(exception_2);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Updates test results to a test run
     * @param testRunId The Test Run Id to which the test case results will be added
     * @param testResults An array of test results to be added to the specified [testRunId]
     */
    RestApiHelper.prototype.updateTestResults = function (testRunId, testResults) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var restRes, exception_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, this._rest.update('_apis/test/Runs/' + testRunId + '/results?api-version=5.1', testResults)];
                                case 1:
                                    restRes = _a.sent();
                                    console.log(restRes.statusCode);
                                    console.log(restRes.result);
                                    if (restRes.statusCode == httpm.HttpCodes.OK && restRes.result) {
                                        console.log('Adding test result SUCCESS');
                                        resolve(restRes.result);
                                    }
                                    else {
                                        console.log('Adding test result FAILED: ');
                                        reject(restRes.result);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    exception_3 = _a.sent();
                                    console.log("Something went wrong updating the test results");
                                    reject(exception_3.message);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Get a list of test results to a test run
     * @param testRunId The Test Run Id for which the test results will be retrieved
     */
    RestApiHelper.prototype.getTestRunResults = function (testRunId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var restRes, exception_4;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, this._rest.get('_apis/test/Runs/' + testRunId + '/results?api-version=5.1')];
                                case 1:
                                    restRes = _c.sent();
                                    console.log(restRes.statusCode);
                                    console.log((_a = restRes.result) === null || _a === void 0 ? void 0 : _a.value);
                                    if (restRes.statusCode == httpm.HttpCodes.OK && restRes.result) {
                                        console.log('Get test run results SUCCESS');
                                        resolve(restRes.result.value);
                                    }
                                    else {
                                        console.log('Get test run results FAILED: ');
                                        reject((_b = restRes.result) === null || _b === void 0 ? void 0 : _b.value);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    exception_4 = _c.sent();
                                    console.log("Something went wrong retrieving the test run results: " + exception_4.message);
                                    reject(exception_4.message);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Update test run by its ID
     * @param testRunId The Test Run Id to be completed
     * @param body Request body to be sent in request.
     */
    RestApiHelper.prototype.completeTestRun = function (testRunId, body) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                console.log("Completing testrun " + testRunId);
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var restRes, exception_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, this._rest.update('_apis/test/Runs/' + testRunId + '?api-version=5.1', body)];
                                case 1:
                                    restRes = _a.sent();
                                    console.log(restRes.statusCode);
                                    console.log(restRes.result);
                                    if (restRes.statusCode == httpm.HttpCodes.OK && restRes.result) {
                                        console.log('Completing test run SUCCESS');
                                        resolve(restRes.result);
                                    }
                                    else {
                                        console.log('Completing test run FAILED: ');
                                        reject(restRes.result);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    exception_5 = _a.sent();
                                    console.log("Something went wrong completing the test run: " + exception_5.message);
                                    reject(exception_5.message);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return RestApiHelper;
}());
exports.RestApiHelper = RestApiHelper;
//# sourceMappingURL=restApiHelper.js.map
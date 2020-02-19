"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var assert = __importStar(require("assert"));
var ttm = __importStar(require("azure-pipelines-task-lib/mock-test"));
describe('PublishJUnitTestResults', function () {
    it('should succeed with simple inputs', function (done) {
        this.timeout(10000);
        var tp = path.join(__dirname, 'success.js');
        var tr = new ttm.MockTestRunner(tp);
        tr.run();
        console.log(tr.succeeded);
        assert.equal(tr.succeeded, true, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");
        console.log(tr.stdout);
        assert.equal(tr.stdout.indexOf('Recieved testRunId') >= 0, true, "should display a test Run Id");
        assert.equal(tr.stdout.indexOf('Sending batch of test results') >= 0, true, "should add the test results");
        assert.equal(tr.stdout.indexOf('Updating test run with final outcome') >= 0, true, "should complete the test run");
        assert.equal(tr.stdout.indexOf('Exiting task') >= 0, true, "should have a graceful exit");
        done();
    });
});
//# sourceMappingURL=_suite.js.map
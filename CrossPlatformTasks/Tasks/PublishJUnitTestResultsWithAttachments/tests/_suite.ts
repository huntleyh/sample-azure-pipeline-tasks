import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('PublishJUnitTestResults', function () {
    it('should succeed with simple inputs', function(done: MochaDone) {
        this.timeout(99999999);

        let tp = path.join(__dirname, 'success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

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
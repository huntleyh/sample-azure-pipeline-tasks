"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TestRunState;
(function (TestRunState) {
    TestRunState[TestRunState["NotStarted"] = 0] = "NotStarted";
    TestRunState[TestRunState["InProgress"] = 1] = "InProgress";
    TestRunState[TestRunState["Completed"] = 2] = "Completed";
    TestRunState[TestRunState["Aborted"] = 3] = "Aborted";
    TestRunState[TestRunState["Waiting"] = 4] = "Waiting";
})(TestRunState = exports.TestRunState || (exports.TestRunState = {}));
//# sourceMappingURL=helperContracts.js.map
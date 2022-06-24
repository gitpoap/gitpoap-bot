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
Object.defineProperty(exports, "__esModule", { value: true });
var cross_fetch_1 = require("cross-fetch");
function generateComment(claims) {
    var qualifier;
    if (claims.length > 1) {
        qualifier = "some GitPOAPs";
    }
    else {
        qualifier = "a GitPOAP";
    }
    var comment = "Woohoo, your important contribution to this open-source project has earned you ".concat(qualifier, "!\n");
    for (var _i = 0, claims_1 = claims; _i < claims_1.length; _i++) {
        var claim = claims_1[_i];
        comment += "\n[**".concat(claim.name, "**](https://www.gitpoap.io/gp/").concat(claim.gitPOAP.id, "):\n<img src=\"").concat(claim.imageUrl, "\" height=\"200px\">");
    }
    comment += '\n\nHead on over to [GitPOAP.io](https://www.gitpoap.io) and connect your GitHub account to mint!';
    return comment;
}
exports.default = (function (app) {
    app.on('pull_request.closed', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var repo, owner, pullRequestNumber, octokit, tokenData, jwt, res, _a, _b, _c, _d, response, issueComment, result;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    // Don't handle closed but not merged PRs
                    if (!context.payload.pull_request.merged) {
                        return [2 /*return*/];
                    }
                    repo = context.payload.repository.name;
                    owner = context.payload.repository.owner.login;
                    pullRequestNumber = context.payload.number;
                    context.log.info("Handling newly merged PR: https://github.com/".concat(owner, "/").concat(repo, "/").concat(pullRequestNumber));
                    return [4 /*yield*/, app.auth()];
                case 1:
                    octokit = _e.sent();
                    return [4 /*yield*/, octokit.apps.createInstallationAccessToken({
                            installation_id: context.payload.installation.id,
                        })];
                case 2:
                    tokenData = _e.sent();
                    return [4 /*yield*/, octokit.auth({ type: 'app' })];
                case 3:
                    jwt = _e.sent();
                    return [4 /*yield*/, (0, cross_fetch_1.fetch)("".concat(process.env.API_URL, "/claims/gitpoap-bot/create"), {
                            method: 'POST',
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(jwt.token),
                            },
                            body: JSON.stringify({
                                repo: repo,
                                owner: owner,
                                pullRequestNumber: pullRequestNumber,
                            }),
                        })];
                case 4:
                    res = _e.sent();
                    if (!(res.status !== 200)) return [3 /*break*/, 6];
                    _b = (_a = context.log).error;
                    _d = (_c = "An issue occurred (response code: ".concat(res.status, "): ")).concat;
                    return [4 /*yield*/, res.text()];
                case 5:
                    _b.apply(_a, [_d.apply(_c, [_e.sent()])]);
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, res.json()];
                case 7:
                    response = _e.sent();
                    if (response.newClaims.length === 0) {
                        context.log.info('No new claims were created by this PR');
                        return [2 /*return*/];
                    }
                    context.log.info("".concat(response.newClaims.length, " new Claims were created by this PR"));
                    issueComment = context.issue({
                        body: generateComment(response.newClaims),
                    });
                    return [4 /*yield*/, context.octokit.issues.createComment(issueComment)];
                case 8:
                    result = _e.sent();
                    context.log.info("Posted comment about new claims: ".concat(result.data.html_url));
                    return [2 /*return*/];
            }
        });
    }); });
    // Useful for testing purposes:
    //
    //  app.on('pull_request.closed', async (context) => {
    //    const pullRequestNum = context.payload.pull_request.number;
    //    const issueComment = context.issue({
    //      body: `Thanks for CLOSING PR #${pullRequestNum}!`,
    //    });
    //
    //    context.log.info(context.payload.repository.owner);
    //
    //    context.log.info('PR HAS BEEN CLOSED');
    //    await context.octokit.issues.createComment(issueComment);
    //  });
});
//# sourceMappingURL=bot.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var probot_1 = require("probot");
var bot_1 = __importDefault(require("../../../bot"));
exports.default = (0, probot_1.createNodeMiddleware)(bot_1.default, {
    probot: (0, probot_1.createProbot)(),
    webhooksPath: '/api/github/webhooks',
});
//# sourceMappingURL=index.js.map
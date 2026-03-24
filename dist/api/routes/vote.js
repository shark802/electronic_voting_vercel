"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vote_1 = require("../controllers/vote");
const router = (0, express_1.Router)();
router
    .route('/vote')
    .post(vote_1.saveVoteFunction);
exports.default = router;

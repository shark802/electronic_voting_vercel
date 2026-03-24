"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const position_1 = require("../controllers/position");
const toUpperCase_1 = require("../../middlewares/toUpperCase");
const router = (0, express_1.Router)();
router.use(toUpperCase_1.toUpperCase);
router.route("/position")
    .post(position_1.addPosition)
    .get(position_1.getAllPositions);
router.delete('/position/:id', position_1.removePosition);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generalAccess_1 = require("../controllers/generalAccess");
const router = (0, express_1.Router)();
router.get("/", generalAccess_1.landingPage);
exports.default = router;

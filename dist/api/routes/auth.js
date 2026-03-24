"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const router = (0, express_1.default)();
router.post("/login", auth_1.loginFunction);
router.post("/logout", auth_1.logoutFunction);
router.post("/verified-face/status", auth_1.isFaceVerified);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../controllers/user");
const toUpperCase_1 = require("../../middlewares/toUpperCase");
const multerConfig_1 = __importDefault(require("../../config/multerConfig"));
const router = (0, express_1.Router)();
router.use(toUpperCase_1.toUpperCase);
router.route('/user/:id')
    .get(user_1.getUserByIdNumber)
    .put(user_1.updateUserFunction);
router.post('/user-new', user_1.newUserFunction);
router.post('/import-user', multerConfig_1.default.single('userFile'), user_1.importUsers);
router.get('/import-records', user_1.getAllImportUserRecords);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ipAddress_1 = require("../controllers/ipAddress");
const toUpperCase_1 = require("../../middlewares/toUpperCase");
const router = (0, express_1.Router)();
router.use(toUpperCase_1.toUpperCase);
router.route('/ip-address')
    .post(ipAddress_1.addIpAddress)
    .get(ipAddress_1.getIpAddress)
    .put(ipAddress_1.removeIpAddress);
router.route('/ip-address/all')
    .get(ipAddress_1.getAllIpAddress);
router.post('/ip-address/validate', ipAddress_1.validateIpAddress);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const population_1 = require("../controllers/population");
const router = (0, express_1.Router)();
router.put('/population/:id', population_1.updateVoterPopulationFunction);
exports.default = router;

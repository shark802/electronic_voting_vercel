"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const election_1 = require("../controllers/election");
const router = (0, express_1.Router)();
router
    .route("/elections")
    .post(election_1.createElection);
router
    .route("/elections/:id")
    .get(election_1.findElectionByID)
    .delete(election_1.deleteElection)
    .put(election_1.updateElection)
    .patch(election_1.updateElectionStatus);
router.put('/election-overview/:id', election_1.closeElectionDashboard);
router.get('/election-population', election_1.getElectionPopulation);
router.get('/election-voted', election_1.getNumberOfVoted);
router.get('/program-population', election_1.getTotalPopulationByProgram);
router.get('/program-voted', election_1.getTotalVotedInElectionByProgram);
router.get('/election/complete/total-voted', election_1.completedElectionsTotalVoted);
router.get('/election/turn-out/year-level', election_1.yearLevelTurnoutPercentage);
router.get('/election/turn-out/department', election_1.departmentTurnoutPercentage);
router.get('/election/turn-out/vote-mode', election_1.votingModeEngagement);
exports.default = router;

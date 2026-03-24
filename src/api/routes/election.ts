import { Router } from "express";
import { closeElectionDashboard, completedElectionsTotalVoted, createElection, deleteElection, departmentTurnoutPercentage, findElectionByID, getElectionPopulation, getNumberOfVoted, getTotalPopulationByProgram, getTotalVotedInElectionByProgram, updateElection, updateElectionStatus, votingModeEngagement, yearLevelTurnoutPercentage } from "../controllers/election";

const router = Router();

router
	.route("/elections")
	.post(createElection);

router
	.route("/elections/:id")
	.get(findElectionByID)
	.delete(deleteElection)
	.put(updateElection)
	.patch(updateElectionStatus)

router.put('/election-overview/:id', closeElectionDashboard);
router.get('/election-population', getElectionPopulation);
router.get('/election-voted', getNumberOfVoted);
router.get('/program-population', getTotalPopulationByProgram);
router.get('/program-voted', getTotalVotedInElectionByProgram);
router.get('/election/complete/total-voted', completedElectionsTotalVoted);
router.get('/election/turn-out/year-level', yearLevelTurnoutPercentage);
router.get('/election/turn-out/department', departmentTurnoutPercentage);
router.get('/election/turn-out/vote-mode', votingModeEngagement);

export default router;

import { Router } from "express"
import {
    dashboardOverview,
    dashboardVoteTally,
    newElection,
    viewElection,
    manageCandidate,
    addCandidate,
    manageVoter,
    reviewRegisterDevice,
    viewRegisterDevice,
    fetchUser,
    editElection,
    viewElectionHistory,
    renderAdminElectionResult,
    generalSettings,
    departmentPrograms,
    manageDepartment,
    commpleteElectionResult,
    electionAnalytics,
    editCertification
} from '../controllers/admin';
import { isAdmin, isAuthenticated } from "../../middlewares/authorization";

const router = Router();

router.use(isAuthenticated)
router.use(isAdmin)

// Dashboard
router.get("/dashboard/overview", dashboardOverview);
router.get("/dashboard/vote-tally", dashboardVoteTally);
router.get("/dashboard/analytics", electionAnalytics);

// Elections
router.get("/election/view", viewElection);
router.get("/election/new", newElection);
router.get("/election/:id/edit", editElection);
router.get("/election/history", viewElectionHistory);
router.get("/election/result/:id", renderAdminElectionResult);
router.get("/election/complete/:id", commpleteElectionResult)
router.get("/election/:id/certification/edit", editCertification);

// Candidate
router.get("/candidate/manage", manageCandidate);
router.get("/candidate/new", addCandidate);

// Voter
router.get("/voter/manage", manageVoter);

// Department
router.get("/department/manage", manageDepartment);
router.get("/department/programs", departmentPrograms);

//Register Device
// router.get("/register-device/request", reviewRegisterDevice);
// router.get("/register-device/registered", viewRegisterDevice);

// Control Panel
router.get("/control-panel/user", fetchUser);
router.get("/control-panel/general-settings", generalSettings);
export default router
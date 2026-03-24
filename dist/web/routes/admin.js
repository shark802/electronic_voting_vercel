"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../controllers/admin");
const authorization_1 = require("../../middlewares/authorization");
const router = (0, express_1.Router)();
router.use(authorization_1.isAuthenticated);
router.use(authorization_1.isAdmin);
// Dashboard
router.get("/dashboard/overview", admin_1.dashboardOverview);
router.get("/dashboard/vote-tally", admin_1.dashboardVoteTally);
router.get("/dashboard/analytics", admin_1.electionAnalytics);
// Elections
router.get("/election/view", admin_1.viewElection);
router.get("/election/new", admin_1.newElection);
router.get("/election/:id/edit", admin_1.editElection);
router.get("/election/history", admin_1.viewElectionHistory);
router.get("/election/result/:id", admin_1.renderAdminElectionResult);
router.get("/election/complete/:id", admin_1.commpleteElectionResult);
router.get("/election/:id/certification/edit", admin_1.editCertification);
// Candidate
router.get("/candidate/manage", admin_1.manageCandidate);
router.get("/candidate/new", admin_1.addCandidate);
// Voter
router.get("/voter/manage", admin_1.manageVoter);
// Department
router.get("/department/manage", admin_1.manageDepartment);
router.get("/department/programs", admin_1.departmentPrograms);
//Register Device
// router.get("/register-device/request", reviewRegisterDevice);
// router.get("/register-device/registered", viewRegisterDevice);
// Control Panel
router.get("/control-panel/user", admin_1.fetchUser);
router.get("/control-panel/general-settings", admin_1.generalSettings);
exports.default = router;

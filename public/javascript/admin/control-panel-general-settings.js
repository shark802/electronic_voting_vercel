// import { hideLoader, showLoading } from "/javascript/helper/loader.js";
import "/javascript/logout.js"
import socket from "/javascript/socket_io.js"
// import { confirmAlert, confirmErrorAlert, showSwalSuccessToast, showSwalErrorToast } from "/javascript/helper/sweetAlertFunctions.js";
import { initializeTrustedIpAddressForm, showTrustedIpAddress } from "/javascript/modules/general_settings/trusted_ip_address.js"; // Import the module
import { initializeDepartmentForm, showDepartmentTable } from "/javascript/modules/general_settings/department_settings.js";
import { initializeSenatorMaxVoteForm, showAllDepartmentsMaxVote } from "/javascript/modules/general_settings/senator_max_vote.js";
import { initializeProgramForm, showAllProgramsTable } from "/javascript/modules/general_settings/program_settings.js";
import { initializePositionForm, showAllPositions } from "/javascript/modules/general_settings/position_settings.js";
const control_panel_nav = document.querySelector("#control_panel_nav");
const general_settings = document.querySelector("#general_settings")

control_panel_nav.classList.remove("font-normal")
control_panel_nav.classList.add("active-page")

$("#control_panel_subpage").slideDown(500);

general_settings.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

// Initialize the trusted IP address form logic
initializeTrustedIpAddressForm();
showTrustedIpAddress();

// Initialize the department form logic
initializeDepartmentForm();
showDepartmentTable();

// Initialize the program form logic
initializeProgramForm();
showAllProgramsTable();

// Initialize the senator max vote form logic
initializeSenatorMaxVoteForm();
showAllDepartmentsMaxVote();

// Initialize the position form logic
initializePositionForm();
showAllPositions();

// Close data table container
document.querySelector("#close-data-table-container").addEventListener("click", () => {
    const dataTableContainer = document.querySelector("#data-table-container");
    dataTableContainer.classList.remove("block");
    dataTableContainer.classList.add("hidden");
});
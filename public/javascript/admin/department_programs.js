import "/javascript/logout.js"
import socket from "/javascript/socket_io.js"

const department_nav = document.querySelector("#department_nav")
const programs_nav = document.querySelector("#programs_nav")

department_nav.classList.remove("font-normal")
department_nav.classList.add("active-page")

programs_nav.classList.add("active-nav")
$("#department_subpage").show();

document.querySelector("#sidebar").classList.add("hidden");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

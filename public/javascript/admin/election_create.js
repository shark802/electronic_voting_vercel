import "/javascript/logout.js"
import "/javascript/socket_io.js"

import { isValidStartDate, isValidEndDate } from "/javascript/formInputValidator/dateValidator.js"
import { isValidText } from "/javascript/formInputValidator/isValidText.js";
import { isValidEndTime, isValidStartTime } from "/javascript/formInputValidator/timeValidator.js";
import { showLoading, hideLoader } from "/javascript/helper/loader.js";
import { changeEventListener } from "/javascript/helper/changeEventListener.js";

// Style active navbar
const election_nav = document.querySelector("#election_nav");
const create_election_page = document.querySelector("#create_election_page");
create_election_page.removeAttribute("href");

election_nav.classList.remove("font-normal")
election_nav.classList.add("active-page")

create_election_page.classList.add("active-nav")
$("#election_subpage").show();

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

// Process create election form
// HTMLInputElement
const election_name = document.querySelector("#election_name")
const date_start = document.querySelector("#date_start")
const time_start = document.querySelector("#time_start")
const date_end = document.querySelector("#date_end")
const time_end = document.querySelector("#time_end")

// Div element to display error message
const election_name_error_message = document.querySelector("#election_name_error_message")
const startDateErrorMessage = document.querySelector("#startdate_error_message")
const startTimeErrorMessage = document.querySelector("#starttime_error_message")
const endDateErrorMessage = document.querySelector("#enddate_error_message")
const endTimeErrorMessage = document.querySelector("#endtime_error_message")

changeEventListener(isValidText, [election_name], election_name_error_message) // Validate the election name if user change focus from input
changeEventListener(isValidStartDate, [date_start], startDateErrorMessage); // Validate the start date input 
changeEventListener(isValidStartTime, [time_start], startTimeErrorMessage)
changeEventListener(isValidEndDate, [date_end, date_start], endDateErrorMessage); // Validate the end date input
changeEventListener(isValidEndTime, [time_end, time_start, date_start, date_end], endTimeErrorMessage)

// validate every input before sending to server
document.querySelector("#create_election_form").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (
        !isValidText([election_name], election_name_error_message) ||
        !isValidStartDate([date_start], startDateErrorMessage) ||
        !isValidEndDate([date_end, date_start], endDateErrorMessage) ||
        !isValidStartTime([time_start], startTimeErrorMessage) ||
        !isValidEndTime([time_end, time_start, date_start, date_end], endTimeErrorMessage)
    ) {
        Swal.fire({
            showConfirmButton: false,
            title: "Submit failed! Please try again",
            icon: "error",
            toast: true,
            position: "top",
            timer: 3000,
        });
        return;
    } else {
        try {

            showLoading()
            const response = await fetch('/api/elections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    election_name: election_name.value,
                    date_start: date_start.value,
                    time_start: time_start.value,
                    date_end: date_end.value,
                    time_end: time_end.value
                })
            })
            hideLoader()
            if (response.ok) {
                const message = await response.json();
                Swal.fire({
                    title: "Success!",
                    text: message.message,
                    icon: "success"
                }).then(result => {
                    if (result.isConfirmed) window.location = "/admin/election/view";
                });
                document.querySelector("#create_election_form").reset();


            } else {
                const message = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Process failed!",
                    text: message.message
                });
            }
        } catch (error) {
            console.error(error);
        }
    }

})
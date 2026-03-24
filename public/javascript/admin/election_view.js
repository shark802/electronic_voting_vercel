import "/javascript/logout.js"
import '/javascript/admin/election_edit.js';
import '/javascript/admin/election_showHide.js';
import '/javascript/admin/election_delete.js';
import socket from "/javascript/socket_io.js"

const election_nav = document.querySelector("#election_nav")
const view_election_page = document.querySelector("#view_election_page")
view_election_page.removeAttribute("href")

election_nav.classList.remove("font-normal")
election_nav.classList.add("active-page")

view_election_page.classList.add("active-nav")
$("#election_subpage").slideDown(500);

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

// Toggle More option
document.querySelectorAll("#more-button").forEach((button) => {

    button.addEventListener('click', (event) => {
        const eventElectionId = event.target.closest("#electionSection").querySelector("#election-card-id").textContent;

        document.querySelectorAll("#more-option").forEach(element => {
            const elementElectionId = element.closest("#electionSection").querySelector("#election-card-id").textContent;

            if (elementElectionId !== eventElectionId) {
                $(element).hide(100);
            } else {
                const parent = $(event.target).parent();
                parent.find('#more-option').toggle(100);
            }
        })

    });

});

// Redirect to add candidate page or disable add candidate button if election is already started.
document.querySelectorAll("#add-candidate").forEach(addButton => {
    addButton.addEventListener('click', async (event) => {
        const parent = event.target.closest("#election-card");
        const electionInfo = parent.querySelector("#election-info");

        const dateStart = electionInfo.dataset.dateStart;
        const timeStart = electionInfo.dataset.timeStart;

        const present = new Date();
        let startDateTime = new Date(dateStart);
        const [hour, minute] = timeStart.split(':');
        startDateTime.setHours(hour, minute);

        if (present > startDateTime) {
            event.target.style.backgroundColor = "#9ca3af";
            event.target.style.color = "#f3f4f6";

            Swal.fire({
                showConfirmButton: false,
                title: "Election has already started, adding candidate is restricted",
                icon: "error",
                toast: true,
                position: "top",
                timer: 3000,
                timerProgressBar: true
            });
            return;
        } else {
            const electionId = parent.querySelector("#election-card-id").textContent;
            // await fetch(`/admin/candidate/new/${true}`);
            window.location.href = `/admin/candidate/new?election_id=${electionId}`;
            // Proceed adding candidate
        }
    })
});

document.querySelector("body").addEventListener('click', (event) => {
    const elementClicked = event.target;
    if (!elementClicked.closest('#option-section')) {
        document.querySelectorAll("#more-option").forEach(card => {
            $(card).hide(100);
        })
    }
})
document.querySelectorAll("#toggleElectionEventVisibility").forEach(toggleButton => {
    toggleButton.addEventListener('click', async (event) => {
        const electionId = event.target.closest("#electionSection").querySelector("#election-card-id").textContent;
        let electionStatus = undefined;

        let viewStatus = event.target.closest("#electionSection").querySelector("#viewStatus");
        let viewStatusImage = event.target.closest("#electionSection").querySelector("#viewStatusImage"); // div element text content contains Hide=(0) or Show=(1)
        let displayStatus = event.target.closest("#electionSection").querySelector("#display-status");

        if (viewStatus.textContent === "Deactivate") {
            // Request to deactivate the election

            electionStatus = 0;
            const updateOutcome = await updateElectionStatus(electionId, electionStatus) // return true if update is successful, false otherwise
            if (updateOutcome) {
                viewStatusImage.src = "/img/view.webp"
                viewStatus.textContent = "Activate";

                displayStatus.textContent = 'Inactive'
                displayStatus.style.color = '#ef4444';
                displayStatus.style.backgroundColor = '#fee2e2';
            }

        } else {
            // Request to activate the election

            electionStatus = 1;
            const updateOutcome = await updateElectionStatus(electionId, electionStatus) // return true if update is successful, false otherwise

            if (updateOutcome) {
                viewStatusImage.src = "/img/hide.webp"
                viewStatus.textContent = "Deactivate";

                displayStatus.textContent = 'Active';
                displayStatus.style.color = '#22c55e';
                displayStatus.style.backgroundColor = '#dcfce7 ';
            }
        }
    })
})

/**
 * 
 * @param {string} electionId - Election ID to be update its status active/inactive 
 * @param {number} electionStatus - the current status of election display
 * @returns {boolean} - return true if update is successfull, false if failed
 */
async function updateElectionStatus(electionId, electionStatus) {
    try {
        const electionMessage = electionStatus === 1 ? "Election status is now active." : "Election status is now inactive.";

        const response = await fetch(`/api/elections/${electionId}?status=${electionStatus}`, {
            method: "PATCH"
        });

        if (response.ok) {
            Swal.fire({
                title: electionMessage,
                icon: "success",
                showConfirmButton: false,
                toast: true,
                position: "top",
                timer: 3000,
                timerProgressBar: true
            });
            return true;
        } else {
            const responseMessage = await response.json();
            Swal.fire({
                showConfirmButton: false,
                title: responseMessage.message,
                icon: "error",
                toast: true,
                position: "top",
                timer: 3000,
                timerProgressBar: true
            });
            return false;
        }

    } catch (error) {
        console.log(error.message);
    }
};
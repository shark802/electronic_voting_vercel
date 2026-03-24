import { isValidStartDate, isValidEndDate } from "/javascript/formInputValidator/dateValidator.js"
import { isValidText } from "/javascript/formInputValidator/isValidText.js";
import { isValidEndTime, isValidStartTime } from "/javascript/formInputValidator/timeValidator.js";
import { changeEventListener } from "/javascript/helper/changeEventListener.js";

const electionCardEditButons = document.querySelectorAll('#election-edit-button');

electionCardEditButons.forEach(cardButton => {
    cardButton.addEventListener('click', async (event) => {
        const parent = event.target.closest("#election-card");

        $(event.target.closest("#more-option")).hide(100);

        const electionId = parent.querySelector("#election-card-id").textContent;

        if (electionId) {
            const response = await fetch(`/api/elections/${electionId}`);

            if (response.ok) {
                const responseObject = await response.json();
                const election = responseObject.election;

                function extractDate(date) {
                    const parsedDate = new Date(date);
                    const year = parsedDate.getFullYear();
                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(parsedDate.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }

                election.date_start = extractDate(election.date_start);
                election.date_end = extractDate(election.date_end);

                document.querySelector("#election_id").textContent = election.election_id;
                document.querySelector("#election_name").value = election.election_name;
                document.querySelector("#date_start").value = election.date_start;
                document.querySelector("#time_start").value = election.time_start;
                document.querySelector("#date_end").value = election.date_end;
                document.querySelector("#time_end").value = election.time_end;

                const modal = document.querySelector("#election-edit-modal");
                modal.showModal(500);

                const closeButton = document.getElementById("closeModal");
                closeButton.addEventListener('click', () => {
                    modal.close();
                });

                // Div element to display error message
                const election_name_error_message = document.querySelector("#election_name_error_message");
                // const startDateErrorMessage = document.querySelector("#startdate_error_message");
                const endDateErrorMessage = document.querySelector("#enddate_error_message");
                const startTimeErrorMessage = document.querySelector("#starttime_error_message");
                const endTimeErrorMessage = document.querySelector("#endtime_error_message");

                // Watch for input value if valid
                changeEventListener(isValidText, [election_name], election_name_error_message) // Validate the election name if user change focus from input
                // changeEventListener(isValidStartDate, [date_start], startDateErrorMessage); // Validate the start date input 
                // changeEventListener(isValidEndDate, [date_end, date_start], endDateErrorMessage); // Validate the end date input
                changeEventListener(isValidStartTime, [time_end, time_start], startTimeErrorMessage)
                changeEventListener(isValidEndTime, [time_end, time_start, date_start, date_end], endTimeErrorMessage)

                const updateForm = document.querySelector("#update_election_form");
                updateForm.addEventListener("submit", async (event) => {
                    await updateElection(event, parent);
                });
            }
        }
    })
})

async function updateElection(event, parent) {
    try {
        event.preventDefault();
        const electionID = document.querySelector("#election_id");
        const electionName = document.querySelector("#election_name");
        const dateStart = document.querySelector("#date_start");
        const timeStart = document.querySelector("#time_start");
        const dateEnd = document.querySelector("#date_end");
        const timeEnd = document.querySelector("#time_end");

        // Div element to display error message
        const election_name_error_message = document.querySelector("#election_name_error_message");
        const startDateErrorMessage = document.querySelector("#startdate_error_message");
        const endDateErrorMessage = document.querySelector("#enddate_error_message");
        const startTimeErrorMessage = document.querySelector("#starttime_error_message");
        const endTimeErrorMessage = document.querySelector("#endtime_error_message");

        if (
            !isValidText([electionName], election_name_error_message) ||
            // !isValidStartDate([dateStart], startDateErrorMessage) ||
            // !isValidEndDate([dateEnd, dateStart], endDateErrorMessage) ||
            !isValidStartTime([timeStart], startTimeErrorMessage) ||
            !isValidEndTime([time_end, time_start, date_start, date_end], endTimeErrorMessage)
        ) {
            console.log('invalid form');
            return;
        } else {
            const updateResponse = await fetch(`/api/elections/${electionID.textContent}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    election_name: electionName.value,
                    date_start: dateStart.value,
                    time_start: timeStart.value,
                    date_end: dateEnd.value,
                    time_end: timeEnd.value
                })
            });

            if (updateResponse.ok) {
                document.querySelector("#election-edit-modal").close();
                Swal.fire({
                    title: "Success!",
                    text: "Update complete",
                    icon: "success"
                });

                // change with updated value if update success
                const formatOptions = {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                }

                const startDateTime = new Date(dateStart.value);
                const [startHour, startMinute] = timeStart.value.split(":");
                startDateTime.setHours(startHour, startMinute);
                const formattedStartDateTime = startDateTime.toLocaleString('en-US', formatOptions);

                const electionEndDateTime = new Date(dateEnd.value);
                const [endHour, endMinute] = timeEnd.value.split(":");
                electionEndDateTime.setHours(endHour, endMinute);
                const formattedEndDateTime = electionEndDateTime.toLocaleString('en-US', formatOptions);

                parent.querySelector("#election-title").textContent = electionName.value;
                parent.querySelector("#displayStart").textContent = formattedStartDateTime;
                parent.querySelector("#displayEnd").textContent = formattedEndDateTime;
                return;
            } else {

                const responseObject = await updateResponse.json();
                Swal.fire({
                    showConfirmButton: false,
                    title: responseObject.message,
                    icon: "error",
                    toast: true,
                    position: "top",
                    timer: 3000,
                });
                return;
            }
        }
    } catch (error) {
        console.error(error);
    }
}
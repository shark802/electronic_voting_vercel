import { confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";

document.querySelector('#result-box').addEventListener('click', event => {
    if (!event.target.closest('section')) return;

    $(event.target.closest('section').querySelector('#rest-candidates')).slideToggle(300);
    console.log('toggle');
});

document.querySelector('#generate-result-pdf').addEventListener('click', async (event) => {
    try {
        console.log('here');

        const action = await confirmAlert('Do you want to generate a PDF report?');
        if (!action.isConfirmed) return;

        const electionId = document.querySelector('#election-id').value;

        window.location.href = `/api/pdf-report/election-result/${electionId}`;

    } catch (error) {
        console.error(error);
    }
})
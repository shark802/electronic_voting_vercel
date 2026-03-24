import { hideLoader, showLoading } from "/javascript/helper/loader.js";
import { isInputNotEmpty } from "/javascript/formInputValidator/isInputNotEmpty.js";
import "/javascript/logout.js"
import { confirmAlert, confirmErrorAlert, showSwalSuccessToast } from "/javascript/helper/sweetAlertFunctions.js";
import socket from "/javascript/socket_io.js"
const control_panel_nav = document.querySelector("#control_panel_nav");
const fetch_user = document.querySelector("#fetch_user")

control_panel_nav.classList.remove("font-normal")
control_panel_nav.classList.add("active-page")

$("#control_panel_subpage").show();

fetch_user.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});


document.querySelector('#user-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formSubmitMethod = event.target.dataset.method;

    const idNumber = event.target.querySelector('#id-number');
    const course = event.target.querySelector('#course');
    const firstname = event.target.querySelector('#firstname');
    const lastname = event.target.querySelector('#lastname');

    // error message div element;
    const idNumberErrorMessage = document.querySelector('#id-number-error-message');
    const courseErrorMessage = document.querySelector('#course-error-message');
    const firstnameErrorMessage = document.querySelector('#firstname-error-message');
    const lastnameErrorMessage = document.querySelector('#lastname-error-message');

    const isValidIdNumber = isInputNotEmpty([idNumber], idNumberErrorMessage);
    const isValidCourse = isInputNotEmpty([course], courseErrorMessage)
    const isValidFirstname = isInputNotEmpty([firstname], firstnameErrorMessage)
    const isValidLastname = isInputNotEmpty([lastname], lastnameErrorMessage)

    if (formSubmitMethod === 'POST') await fetchUser(idNumber.value)

    if (!isValidIdNumber || !isValidCourse || !isValidFirstname || !isValidLastname) return;

    const confirmActionMessage = formSubmitMethod === 'POST' ? 'Are you sure you want to add new user?' : 'Are you sure you want to update this user information?'
    const action = await confirmAlert(confirmActionMessage);
    if (!action.isConfirmed) return;

    const url = fetchUrlByFormMethod(formSubmitMethod);
    const userObject = {
        id_number: idNumber.value,
        course: course.value,
        firstname: firstname.value,
        lastname: lastname.value,
    }
    const userRoles = getUserRoles();

    const response = await userFormSubmitToServer(formSubmitMethod, url, userObject, userRoles);
    const responseObject = await response.json();

    if (!response.ok) return confirmErrorAlert(responseObject.message);
    else return showSwalSuccessToast(responseObject.message);
});

document.querySelector('#search-user').addEventListener('submit', async event => {
    event.preventDefault();
    document.querySelector('#id-number-error-message').textContent = ''

    const searchInput = event.target.querySelector('#id_number');
    const searchIdNumberValue = searchInput.value;

    const response = await fetch(`/api/user/${searchIdNumberValue}`);
    const responseObject = await response.json();

    if (!response.ok) return confirmErrorAlert(responseObject.message)
    if (!responseObject.user) return confirmErrorAlert(`User ${searchIdNumberValue} has no record in the system`)

    const formContentObject = {
        formMethod: 'PUT',
        title: 'Edit user',
        submitButtonText: 'Update user',
        user: responseObject.user
    }

    changeUserForm(formContentObject);
    displayUserInfo(responseObject.user);
    await displayVoterElectionHistory(searchIdNumberValue);

});

document.querySelector('#search-user').addEventListener('change', async event => {
    if (event.target.value.trim() === '') {
        document.querySelector('#user-info').textContent = "";
    }
});

function getUserRoles() {
    const rolesCheckBox = document.querySelector('#user-roles').querySelectorAll('input[type=checkbox]');

    const userRoleObject = Array.from(rolesCheckBox).reduce((object, roleCheckBox) => {
        object[roleCheckBox.value] = roleCheckBox.checked;
        return object;
    }, {});

    return userRoleObject;
}

function fetchUrlByFormMethod(formSubmitMethod) {
    let fetchUrl = '';

    switch (formSubmitMethod) {
        case "POST": fetchUrl = '/api/user-new'
            break;
        case "PUT": fetchUrl = '/api/user'
            break;
        default:
            break;
    }

    return fetchUrl;
}

async function fetchUser(userId) {
    try {
        if (!userId) throw new Error('Missing user id required for validating user id input');

        const response = await fetch(`/api/user/${userId}`);
        const responseObject = await response.json();

        const user = responseObject.user;
        const isUserExist = user ? true : false;

        isUserExist ? document.querySelector('#id-number-error-message').textContent = 'Id number already exist' : document.querySelector('#id-number-error-message').textContent = '';
        return isUserExist;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function userFormSubmitToServer(formSubmitMethod, fetchUrl, userObject, userRoles) {
    try {
        if (formSubmitMethod === 'PUT') {
            fetchUrl = `${fetchUrl}/${userObject.id_number}`
        }

        const response = await fetch(fetchUrl, {
            method: formSubmitMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userObject, userRoles })
        });

        return response;

    } catch (error) {
        console.error(error);
    }
}

document.querySelector('#id-number').addEventListener('change', async (event) => {
    const form = event.target.closest('#user-form');
    const formMethod = form.dataset.method;
    if (formMethod !== 'POST') return;
    if (!event.target.value) return document.querySelector('#id-number-error-message').textContent = '';

    const userId = event.target.value;
    try {
        showLoading();
        await fetchUser(userId);
        hideLoader();

    } catch (error) {
        console.error(error);
    }
});

function changeUserForm(formContentObject) {
    const form = document.querySelector('#user-form');
    form.reset();

    form.dataset.method = formContentObject.formMethod;
    form.querySelector('h3').textContent = formContentObject.title;
    form.querySelector('#user-form-submit-button').value = formContentObject.submitButtonText;

    if (formContentObject.formMethod === 'PUT') {
        form.querySelector('#id-number').readonly = true;
        form.querySelector('#id-number').value = formContentObject.user.id_number
        form.querySelector('#firstname').value = formContentObject.user.firstname
        form.querySelector('#lastname').value = formContentObject.user.lastname

        const options = form.querySelector('#course').querySelectorAll('option');
        for (const option of options) {
            if (option.value === formContentObject.user.course) {
                option.selected = true;
                break;
            }
        }

        if (formContentObject.user.voter) form.querySelector('#voter').checked = true;
        if (formContentObject.user.program_head) form.querySelector('#program-head').checked = true;
        if (formContentObject.user.admin) form.querySelector('#admin').checked = true;
    }


}

function displayUserInfo(userObject) {
    const displayUserInfo = document.querySelector('#user-info');
    displayUserInfo.innerHTML = '';

    const userInfoDiv = document.createElement('div');
    userInfoDiv.id = 'user-info-container';
    userInfoDiv.classList.add('animate-slide-in', 'bg-blue-50', 'rounded-md', 'lg:pl-12', 'py-5', 'shadow-sm', 'border-2', 'border-blue-400');

    displayUserInfo.append(userInfoDiv);

    let additionalInfo = '';
    if (userObject.user_group === "STUDENT") {
        additionalInfo = `<div class="flex">Year/section:<p class="pl-2 text-gray-700 font-medium"> ${userObject.year_level}-${userObject.section}</p></div>`;
    }

    const email = userObject.email ? `<div class="flex">Email:<p class="pl-2 text-gray-700 font-medium"> ${userObject.email}</p> </div>` : `<div class="flex">Email:<p class="pl-2 text-gray-700 font-medium"> N/A </p> </div>`
    const cpNumber = userObject.cp_number ? `<div class="flex">Cp number:<p class="pl-2 text-gray-700 font-medium"> ${userObject.cp_number}</p> </div>` : `<div class="flex">Cp number:<p class="pl-2 text-gray-700 font-medium"> N/A </p> </div>`

    const userInfoContent = `
        <div class="flex">Id number:<p class="pl-2 text-gray-700 font-medium"> ${userObject.id_number}</p> </div>
        <div class="flex">Fullname: <p class="pl-2 text-gray-700 font-medium">${userObject.firstname} ${userObject.lastname} </p></div>
        <div class="flex">Program:<p class="pl-2 text-gray-700 font-medium"> ${userObject.course}</p> </div>
        ${additionalInfo}
        <br>
        ${email}
        ${cpNumber}
        <br>
        `
    userInfoDiv.innerHTML = userInfoContent;

}

async function displayVoterElectionHistory(idNumber) {
    try {

        const response = await fetch(`/api/voter/voter-history/${idNumber}`);
        const responseObject = await response.json();

        if (response.ok) {
            const voterElectionHistory = responseObject.voterElectionHistory;

            const displayUserInfo = document.querySelector('#user-info');
            const divContainer = document.createElement('div');
            divContainer.id = 'voter-history-container';
            divContainer.classList.add('animate-slide-in', 'rounded-md', 'py-4', 'shadow-sm', 'mb-10');

            const voterHistoryContent = voterElectionHistory.map(historyInfo => {

                const electionDate = new Date(historyInfo.date_start);
                const [hour, minute] = historyInfo.time_start.split(':');
                electionDate.setHours(hour, minute);

                const endDate = new Date(historyInfo.date_end);
                const [endHour, endMinute] = historyInfo.time_end.split(':');
                endDate.setHours(endHour, endMinute);

                // Determine the election status
                let status;
                const now = new Date();
                if (now < electionDate) {
                    status = 'Not Started';
                } else if (now >= electionDate && now <= endDate) {
                    status = 'Ongoing';
                } else {
                    status = 'Finished';
                }

                const displayVoteDetails = historyInfo.voted ? `
                    <div class="px-2 my-2" id="vote-detail">
                        <div class="text-gray-500 w-fit text-sm cursor-pointer flex items-center ${!historyInfo.voted && historyInfo.voted !== 'null' ? 'invisible' : ''}" id="view-details-toggle">
                            <span class="mr-2">View Details</span>
                            <svg class="transform transition-transform duration-300" id="details-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M4.293 5.293a1 1 0 0 1 1.414 0L8 7.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z"/>
                            </svg>
                        </div> 
                    
                        <div class="hidden mt-1 border rounded-md shadow-sm bg-gray-50 p-2" id="details-content">
                            <div class="w-full">
                                <span class="font-semibold">Time casted:</span>
                                <span class="text-gray-700">${historyInfo.time_casted ? new Date(historyInfo.time_casted).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div class="w-full">
                                <span class="font-semibold">Voting mode:</span>
                                <span class="text-gray-700">${historyInfo.voting_mode ? historyInfo.voting_mode : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="min-h-6"></div>
                `;

                return `
                <div class="bg-white shadow-md rounded-lg p-4 mb-4 border-2">
                    <div class="flex justify-between items-center">
                        <span class="px-3 text-nowrap min-w-fit inline-block py-1 text-sm font-medium w-12 mb-2 rounded-full ${historyInfo.voted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">
                            ${historyInfo.voted ? 'Voted' : 'Not Voted'}
                        </span>
                        <p class="text-gray-500 text-sm text-right">${status}</p>
                    </div>
                    

                    <h3 class="text-xl font-semibold">${historyInfo.election_name}</h3>
                    <p class="text-gray-500 text-sm">Election ID: <span class="font-medium">${historyInfo.election_id}</span></p>
                    
                    <div class="min-h-8 flex flex-col">
                        

                        ${displayVoteDetails}

                        <div class="">
                            <p class="text-gray-700 float-right font-medium">${electionDate.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}</p>
                        </div>
                    </div>
                </div>
                `
            }).join(' ');

            const divContainerContent = '<h2 class="font-semibold text-lg mb-3">Voter Participation History</h2>' + voterHistoryContent;
            divContainer.innerHTML = divContainerContent;
            displayUserInfo.appendChild(divContainer);
        }

    } catch (error) {
        console.error(error);

    }
}

document.body.querySelector('#add-user-button').addEventListener('click', () => {
    const formContentObject = {
        formMethod: 'POST',
        title: 'Add new user',
        submitButtonText: 'Save user',
    }
    changeUserForm(formContentObject);

    document.querySelector('#user-info').innerHTML = '';
});

document.body.querySelector('#import-user-button').addEventListener('click', (event) => {
    const importUserDropdown = event.target.closest('#import-user-container').querySelector('#import-user-dropdown');
    $(importUserDropdown).show(400);
});

document.body.querySelector('#close-import-user-dropdown').addEventListener('click', (event) => {
    const importUserDropdown = event.target.closest('#import-user-dropdown');
    $(importUserDropdown).hide(400);
});

// submit import user form
document.body.querySelector('#import-user-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    try {
        const response = await fetch('/api/import-user', {
            method: 'POST',
            body: formData
        });

        const responseObject = await response.json();

        if (!response.ok) {
            return confirmErrorAlert(responseObject.message);
        }

        return;
        // return Swal.fire({
        //     title: 'Processing your request...',
        //     text: 'This might take a few moments',
        //     icon: 'success',
        //     confirmButtonColor: "#2060f7",
        //     reverseButtons: true,
        // });

    } catch (error) {
        console.error(error);

    }
});

// Toggle view vote detail history of voter
document.querySelector('#user-info').addEventListener('click', (event) => {

    if (event.target.closest("#view-details-toggle")) {

        const detailsContent = event.target.closest('#vote-detail').querySelector('#details-content');
        const detailsIcon = document.getElementById('details-icon');

        $(detailsContent).slideToggle(300)
        detailsIcon.classList.toggle('rotate-180');
    }
})

// Import User Progress modal
const importUsersModal = document.querySelector('#import-progress-modal')

let isModalOpen = false; // Flag to track if the modal is currently open

// Function to show the import progress modal
function showImportProgressModal() {
    importUsersModal.showPopover();
    isModalOpen = true; // Set the flag to true when the modal is shown
}

const importRecords = document.querySelector('#import-records').querySelectorAll('#import-record');

// Listen for user import updates
socket.on('user-import-update', (data) => {

    const { percentage, currentInserted } = data;
    const progressBar = document.getElementById('progress-fill');
    const progressText = document.getElementById('percentage');
    const successCount = document.getElementById('success-count');

    // Update the progress bar width and text
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${Math.round(percentage)}%`;
    successCount.textContent = currentInserted;


    // Show the modal only if it is not already open
    if (!isModalOpen) {
        showImportProgressModal();
    }

    for (const record of importRecords) {

        const recordId = record.querySelector('[name=importId]').value;
        const recordStatus = record.querySelector('.record-status');

        if (recordId === data.importId) {
            recordStatus.outerHTML = `
                <div class="flex items-center font-medium text-blue-600 record-status">
                    <svg class="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.5" />
                        <path d="M12 2v4M12 18v4M2 12h4m14 0h4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                    <span>
                        On Progress
                    </span>
                </div>
            `;
            break;
        }
    }

});

// Listen for failed import users
socket.on('user-import-failed', (data) => {
    if (data?.status === 'FAILED') {

        if (isModalOpen) {
            importUsersModal.hidePopover();
            isModalOpen = false;
        }

        return Swal.fire({
            title: 'Import Failed',
            text: `Error inserting data on row ${data?.userIndex}`,
            icon: 'error',
            confirmButtonColor: "#2060f7",
            confirmButtonText: 'Okay',
            reverseButtons: true,
        });

    }
})

// Listen if users import success
socket.on('user-import-success', (data) => {
    if (data?.status === 'SUCCESSFUL') {
        if (isModalOpen) {
            importUsersModal.hidePopover();
            isModalOpen = false;
        }

        for (const record of importRecords) {

            const recordId = record.querySelector('[name=importId]').value;
            const recordStatus = record.querySelector('.record-status');

            if (recordId === data.importId) {
                recordStatus.outerHTML = `
                 <div class="flex items-center font-medium text-green-600 record-status">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm4.29 7.29l-5 5a1 1 0 01-1.42 0l-2-2a1 1 0 011.42-1.42L10 10.59l4.29-4.29a1 1 0 011.42 1.42z" />
                    </svg>
                    <span>
                        Success
                    </span>
                </div>
            `;
                break;
            }
        }

        return Swal.fire({
            title: data.message,
            text: `Successfully imported ${data.importSize} users`,
            icon: 'success',
            confirmButtonColor: "#2060f7",
            confirmButtonText: 'Okay',
            reverseButtons: true,
        });
    }
});

// Close modal event listener
document.getElementById('close-modal').addEventListener('click', function () {
    document.getElementById('import-progress-modal').style.display = 'none';
    isModalOpen = false;
});
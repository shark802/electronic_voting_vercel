// import { setTimeout } from "timers/promises";
import "/javascript/logout.js";
import { isInputNotEmpty } from '/javascript/formInputValidator/isInputNotEmpty.js'
import { confirmAlert, showSwalSuccessToast, showSwalErrorToast } from "/javascript/helper/sweetAlertFunctions.js";
import { showLoading, hideLoader } from "/javascript/helper/loader.js";

import socket from "/javascript/socket_io.js"

const candidate_nav = document.querySelector("#candidate_nav");
const manage_candidate = document.querySelector("#manage_candidate");

candidate_nav.classList.remove("font-normal");
candidate_nav.classList.add("active-page");

$("#candidate_subpage").slideDown(500);

manage_candidate.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

main();

function main() {
    toggleDisplayCandidate(); // Toggle the candidate table to display for management
    displayInitialCandidate(); //  Will display the initial candidates(President position)
    displayCandidatesForPositionClick(); // Will update the candidate table if click new candidate position
    triggerOptionOrEdit(); // Will open the more option or edit if tey are click
    closeOptions() // Will close opened options if click is outside the options
    updateCandidateStatus();
}

function toggleDisplayCandidate() {
    document.querySelectorAll("#election").forEach(election => {
        election.addEventListener('click', event => {
            if (!event.target.closest("#candidates-display")) {
                $(event.target.closest("#election").querySelector("#candidates-display")).slideToggle(300);
            }
        })
    });
}

function displayInitialCandidate() {
    document.addEventListener('DOMContentLoaded', async () => {
        document.querySelector("#position").classList.remove("text-gray-400");
        document.querySelector("#position").classList.add("selected-position"); // set as default position selected

        const candidates = await fetchCandidates(document.querySelector("#position").textContent);
        displayFetchCandidate(candidates);
    })
}

function displayCandidatesForPositionClick() {
    document.querySelectorAll("#position").forEach(position => {
        position.addEventListener('click', async (event) => {
            styleSelectedPosition(event);

            const candidates = await fetchCandidates(position.textContent);
            displayFetchCandidate(candidates);
        });
    });
}

function triggerOptionOrEdit() {
    document.querySelectorAll("#candidates-section").forEach(section => { // Open more option
        section.addEventListener('click', async (event) => {
            if (event.target.closest('#option-section')) {
                toggleMoreOptionDisplay(event);
            }

            if (event.target.closest("#edit")) {
                await editCandidate(event);
            }

            if (event.target.closest("#delete_candidate")) {
                await deleteCandidate(event);
            }

        })
    });
}

function closeOptions() {
    document.addEventListener('click', event => { // Close if there is an open section  
        if (!event.target.closest("#option-section")) {
            document.querySelectorAll("#candidates-section").forEach(candidateSection => {
                candidateSection.querySelectorAll("#more-option").forEach(section => $(section).slideUp(100))
            })
        }
    })
}

function updateCandidateStatus() {
    document.querySelectorAll("#candidates-section").forEach(candidateSection => {
        candidateSection.addEventListener('click', async (event) => {

            const status = String(event.target.closest('tr').querySelector('td[data-status]').dataset.status == 1 ? 0 : 1);
            const candidate_id = event.target.closest('tr').dataset.candidateId;

            if (event.target.closest("#toggleCandidateStatus")) {
                const action = await confirmAlert("Confirm Update", "Please confirm your action to update the candidate status")
                if (!action.isConfirmed) return;

                showLoading()
                const response = await fetch(`/api/candidate/status/${candidate_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: status })
                });
                hideLoader()

                const responseObject = await response.json()
                if (!response.ok) {
                    showSwalErrorToast(responseObject.message)
                    return;
                }
                changeUpdateStatusIcon(status, event); // change active/inactive diplay state
                toggleStatusOptionDisplay(event); // will update the option icon activate/deactivate
                event.target.closest('tr').querySelector('td[data-status]').dataset.status = status;

                showSwalSuccessToast(responseObject.message);
                return;
            }
        })
    })
}

async function deleteCandidate(event) {
    const candidateId = event.target.closest('tr').dataset.candidateId;

    const action = await confirmAlert("Are you sure you want to delete this candidate?");
    if (!action.isConfirmed) return;

    showLoading()
    const response = await fetch(`/api/candidate/${candidateId}`, { method: 'DELETE' });
    const responseObject = await response.json();
    hideLoader()

    if (!response.ok) {
        showSwalErrorToast(responseObject.message)
        return;
    }

    showSwalSuccessToast(responseObject.message);
    event.target.closest('tr').remove();
    return;
}

async function editCandidate(event) {
    const candidateId = event.target.closest('tr').dataset.candidateId;

    await displayEditForm(event);
    await confirmCandidateUpdate(candidateId);
}


// HELPER FUNCTIONS
function styleSelectedPosition(event) {
    document.querySelectorAll("#position").forEach(pos => {
        pos.classList.remove("selected-position");
        pos.classList.add("text-gray-400");
    });

    event.target.classList.remove("text-gray-400");
    event.target.classList.add("selected-position");
}

async function fetchCandidates(position) {
    try {
        const electionsQueryParameter = Array.from(document.querySelectorAll("#election")).map(election => {
            const electionId = election.querySelector("#election-id").textContent.trim();
            return `election_id=${electionId}`;
        }).join("&");

        if (!electionsQueryParameter) return; // return if no election exist

        showLoading()
        const url = `/api/candidate?position=${position}&${electionsQueryParameter}`

        const response = await fetch(url);
        hideLoader()
        if (response.ok) {
            const responseObject = await response.json();
            return responseObject;
        }
    } catch (error) {
        console.error(error);
    }
}

function displayFetchCandidate(candidates) {
    document.querySelectorAll("tbody").forEach(content => {
        content.innerHTML = "";
    })

    candidates.forEach(candidate => {

        const status = candidate.enabled === 1 ? '<div class="active">ACTIVE</div>' : '<div class="inactive">INACTIVE</div>';
        let statusOptionDisplay
        if (candidate.enabled === 0) {
            statusOptionDisplay = `
            <div id="toggleCandidateStatus" class="flex items-center px-4 py-2 transition-colors duration-200 cursor-pointer hover:bg-gray-50">
                <img id="viewStatusImage" src="/img/view.webp" alt="view" class="w-4 h-4">
                <p id="viewStatus" class="ml-2">Activate</p>
            </div>
            `
        } else {
            statusOptionDisplay = `
            <div id="toggleCandidateStatus" class="flex items-center px-4 py-2 transition-colors duration-200 cursor-pointer hover:bg-gray-50">
                <img id="viewStatusImage" src="/img/hide.webp" alt="hide" class="w-4 h-4">
                <p id="viewStatus" class="ml-2">Deactivate</p>
            </div>
            `
        }
        let candidateAddedAt = new Date(candidate.added_at);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };

        candidateAddedAt = candidateAddedAt.toLocaleString('en-US', options);

        const tableRow = `
            <tr data-candidate-id="${candidate.candidate_id}" class="border-b border-gray-200 hover:bg-gray-50">
                <td class="px-2 py-2 text-sm text-gray-900 text-center">${candidate.id_number}</td>
                <td class="px-2 py-2 text-nowrap text-sm text-gray-800">
                    <span class="font-medium">${candidate.lastname}</span>, ${candidate.firstname}
                </td>
                <td class="px-2 py-2 text-sm text-gray-700 text-center">${candidate.party}</td>
                <td class="px-2 py-2 text-sm text-gray-700 text-center">${candidate.course}</td>
                <td class="px-2 py-2 text-sm text-gray-600 whitespace-nowrap">${candidateAddedAt}</td>
                <td data-status="${candidate.enabled}" class="px-2 py-2 text-sm text-center">
                    <span class=" py-0.5 text-xs ${candidate.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded">
                        ${status}
                    </span>
                </td>
                <td class="px-2 py-2">
                    <div class="flex justify-center items-center gap-2">
                        
                        <div id="option-section" class="relative px-2">
                            <button class="p-1 hover:bg-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="More options">
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                </svg>
                            </button>

                            <div id="more-option" class="absolute right-0 z-10 hidden w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">

                               ${statusOptionDisplay}

                                <div id="delete_candidate" class="flex items-center px-4 py-2 transition-colors duration-200 cursor-pointer hover:bg-gray-50">
                                    <img src="/img/trash.webp" alt="delete" class="w-4 h-4 mr-2">
                                    <p class="text-gray-700">Delete</p>
                                </div>

                            </div>
                        </div>
                        
                        <button id="edit" class="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200">
                            Edit
                        </button>
                        
                    </div> 
                </td>
            </tr>
        `
        document.querySelector(`tbody[data-election-id="${candidate.election_id}"]`).innerHTML += tableRow;
    })
}

function toggleMoreOptionDisplay(event) {

    document.querySelectorAll("#candidates-section").forEach(section => { // Close other more option if there is opened before opening new option
        section.querySelectorAll("#more-option").forEach(option => {
            if (option !== event.target.closest("#option-section").querySelector("#more-option")) {
                $(option).slideUp(100);
            }
        })
    });

    if (event.target.closest("#more-option")) return;
    $(event.target.closest("#option-section").querySelector("#more-option")).slideToggle(300)
}

function changeUpdateStatusIcon(status, event) {
    const statusWord = event.target.closest('tr').querySelector('td[data-status]').querySelector('div');
    const newStatus = status == 1 ? 'ACTIVE' : 'INACTIVE';
    if (Number(status) === 1) {
        statusWord.textContent = newStatus;
        event.target.closest('tr').querySelector('td[data-status]').querySelector('div').classList.remove('inactive');
        event.target.closest('tr').querySelector('td[data-status]').querySelector('div').classList.add('active');
    } else {
        statusWord.textContent = newStatus;
        event.target.closest('tr').querySelector('td[data-status]').querySelector('div').classList.remove('active');
        event.target.closest('tr').querySelector('td[data-status]').querySelector('div').classList.add('inactive');
    }
}

function toggleStatusOptionDisplay(event) {
    const prevStatus = event.target.closest("#toggleCandidateStatus").querySelector("#viewStatus");
    if (prevStatus.textContent == 'Activate') {
        prevStatus.textContent = "Deactivate";
        event.target.closest("#candidates-section").querySelector("#viewStatusImage").src = "/img/hide.webp"
    } else {
        prevStatus.textContent = "Activate";
        event.target.closest("#candidates-section").querySelector("#viewStatusImage").src = "/img/view.webp"
    }

}

async function displayEditForm(event) {
    const dialog = document.querySelector('dialog');

    try {
        const candidateId = event.target.closest('tr[data-candidate-id]').dataset.candidateId;


        const response = await fetch(`/api/candidate/${candidateId}`);
        const responseObject = await response.json();

        if (responseObject.candidate_profile) {
            dialog.querySelector('#candidateImage').src = `/img/candidate_profiles/${responseObject.candidate_profile}`;
        } else {
            dialog.querySelector('#candidateImage').src = `/img/default-profile.webp`;
        }
        dialog.querySelector('#fullname').textContent = `Fullname:  ${responseObject.lastname}, ${responseObject.firstname}`;
        dialog.querySelector('#id-number').textContent = `ID:  ${responseObject.id_number}`;
        dialog.querySelector('#course').textContent = `Course:  ${responseObject.course}`;

        // dialog.querySelector("#alias").value = responseObject.alias;
        dialog.querySelector("#party").value = responseObject.party;
        const positionOptions = dialog.querySelector("#selectPosition").querySelectorAll('option');
        for (let option of positionOptions) {
            if (option.value === responseObject.position) {
                option.selected = true;
                break;
            }
        }

    } catch (error) {
        console.error(error);
    }

    document.querySelector("dialog").showModal();

    // Close modal
    document.querySelector("#closeModal").addEventListener('click', (event) => {
        event.target.closest('dialog').close()
    })
}

async function confirmCandidateUpdate(candidateId) {
    try {
        document.querySelector("#editCandidateForm").addEventListener('submit', async (event) => {
            event.preventDefault();
            document.querySelector('dialog').close();

            if (!validateFormBeforeSubmit(event)) {
                showSwalErrorToast('Update failed, Please check the form before you submit');
                return;
            }

            const action = await confirmAlert("Confirm Update", "Please confirm to update the candidate");
            if (!action.isConfirmed) return;

            const formData = new FormData(event.target);

            showLoading()
            const response = await fetch(`/api/candidate/${candidateId}`, {
                method: 'PUT',
                body: formData
            });
            const responseObject = await response.json();
            hideLoader()
            if (!response.ok) {
                showSwalErrorToast(responseObject.message);
                return;
            }

            showSwalSuccessToast(responseObject.message);

            const candidates = await fetchCandidates(document.querySelector(".selected-position").textContent);
            displayFetchCandidate(candidates);
            return;

        })

    } catch (error) {
        console.error(error);
    }
}

function validateFormBeforeSubmit(event) {
    const positionInput = event.target.querySelector("#selectPosition");
    const partyInput = event.target.querySelector("#party");

    const positionErrorMessage = event.target.querySelector("#positionErrorMessage")
    const partyErrorMessage = event.target.querySelector("#partyErrorMessage")
    if (
        !isInputNotEmpty([positionInput], positionErrorMessage) ||
        !isInputNotEmpty([partyInput], partyErrorMessage)
    ) {
        return false;
    }
    return true;
}
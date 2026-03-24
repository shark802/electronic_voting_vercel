import { confirmAlert, confirmErrorAlert, showSwalSuccessToast } from "/javascript/helper/sweetAlertFunctions.js"
import "/javascript/logout.js"
import socket from "/javascript/socket_io.js"

const register_device_nav = document.querySelector("#register_device_nav")
const review_request = document.querySelector("#review_request")

register_device_nav.classList.remove("font-normal")
register_device_nav.classList.add("active-page")

$("#register_device_subpage").slideDown(500);

review_request.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

declineDeviceRegistration();
acceptDeviceRegistration();

function declineDeviceRegistration() {
    document.querySelector("#register-device-table").addEventListener('click', (event) => {
        if (event.target.id !== "decline-request") return

        const rowClicked = event.target.closest('tr');
        const codename = rowClicked.querySelector('#codename').textContent;
        const uuid = rowClicked.querySelector('#uuid').textContent;
        const requestDate = rowClicked.querySelector('#request-date').textContent;

        const declineModal = document.querySelector('#decline-request-modal');
        displayRegistrationRequestInfo(declineModal, codename, uuid, requestDate);

        // initiate to submit request if the decline modal is confirmed.

    })
}

function displayRegistrationRequestInfo(modal, codename, uuid, requestDate) {
    modal.querySelector('#codename').textContent = codename
    modal.querySelector('#uuid').textContent = uuid
    modal.querySelector('#request-date').textContent = requestDate
}

async function submitDeclineToServer(uuid) {
    const response = await fetch(`/api/uuid/${uuid}`, { method: 'DELETE' });
    return response;
}

function acceptDeviceRegistration() {
    document.querySelector("#register-device-table").addEventListener('click', (event) => {
        if (event.target.id !== "accept-request") return;

        const rowClicked = event.target.closest('tr');
        const codename = rowClicked.querySelector('#codename').textContent;
        const uuid = rowClicked.querySelector('#uuid').textContent;
        const requestDate = rowClicked.querySelector('#request-date').textContent;

        const acceptModal = document.querySelector('#accept-request-modal');

        displayRegistrationRequestInfo(acceptModal, codename, uuid, requestDate);
    })
}

document.querySelector('#decline-request-modal').addEventListener('click', async (event) => {
    if (event.target.id !== "confirm-decline") return;

    const uuid = event.target.closest('#decline-request-modal').querySelector('#uuid').textContent;

    try {
        const response = await submitDeclineToServer(uuid);
        const responseObject = await response.json();
        if (!response.ok) {
            return confirmErrorAlert(responseObject.message);
        }

        document.querySelector(`tr[data-uuid="${uuid}"]`).remove();
        return showSwalSuccessToast(responseObject.message);

    } catch (error) {
        console.error(error);
    }
})

document.querySelector('#accept-request-modal').addEventListener('click', async (event) => {
    if (event.target.id !== "confirm-accept") return;

    const uuid = event.target.closest('#accept-request-modal').querySelector('#uuid').textContent;

    try {
        const response = await submitAcceptToServer(uuid);
        const responseObject = await response.json();

        if (!response.ok) return confirmErrorAlert(responseObject.message);

        document.querySelector(`tr[data-uuid="${uuid}"]`).remove();
        return showSwalSuccessToast(responseObject.message);

    } catch (error) {
        console.error(error);
    }

})

async function submitAcceptToServer(uuid) {
    const response = await fetch(`/api/uuid/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isToRegister: true })
    });

    return response;
}


socket.on('new-register-device-request', (codeName, uuid) => {


    const requestDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const newRow = `
        <tr data-uuid="${uuid}" class="transition-all tablerow">
            <td id="codename" class="py-1 text-sm font-medium text-center text-gray-700">${codeName}</td>
            <td id="uuid" class="py-1 text-sm font-medium text-center text-gray-700">${uuid}</td>
            <td id="request-date" class="hidden py-1 text-sm font-medium text-center text-gray-700 sm:table-cell">${requestDate}</td>
            <td class="py-2 text-sm font-medium text-center text-gray-700">
                <div class="flex flex-col items-center justify-center gap-2 sm:flex-row">
                <button popovertarget="decline-request-modal" id="decline-request" class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Decline
                </button>
                <button popovertarget="accept-request-modal" id="accept-request" class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Accept
                </button>
              </div>
            </td>
        </tr>
    `;

    document.querySelector('#register-device-table tbody').insertAdjacentHTML('afterbegin', newRow);
});
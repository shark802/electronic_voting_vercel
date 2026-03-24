import {confirmErrorAlert, showSwalSuccessToast} from "/javascript/helper/sweetAlertFunctions.js"
import "/javascript/logout.js"
import socket from "/javascript/socket_io.js"

const register_device_nav = document.querySelector("#register_device_nav");
const registered_device = document.querySelector("#registered_device");

register_device_nav.classList.remove("font-normal");
register_device_nav.classList.add("active-page");

$("#register_device_subpage").show();

registered_device.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

removeRegisteredDevice();

function removeRegisteredDevice() {
    document.querySelector('#registered-device-table').addEventListener('click', (event) => {
        if (event.target.id !== 'remove-device') return;

        const tableRow = event.target.closest('tr');
        const codename = tableRow.querySelector('#codename').textContent;
        const uuid = tableRow.querySelector('#uuid').textContent;
        const requestDate = tableRow.querySelector('#request-date').textContent;

        const removeModal = document.querySelector('#remove-device-modal');

        displayRegisteredDeviceInfo(removeModal, codename, uuid, requestDate);
    })
}

document.querySelector('#remove-device-modal').addEventListener('click', async (event) => {
    if (event.target.id !== "confirm-remove") return;

    const uuid = event.target.closest('#remove-device-modal').querySelector('#uuid').textContent;

    try {
        const response = await sendRequestToRemoveDevice(uuid);
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

function displayRegisteredDeviceInfo(modal, codename, uuid, requestDate) {
    modal.querySelector('#codename').textContent = codename
    modal.querySelector('#uuid').textContent = uuid
    modal.querySelector('#request-date').textContent = requestDate
}

async function sendRequestToRemoveDevice(uuid) {
    return await fetch(`/api/uuid/${uuid}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({isToRegister: false})
    });
}

socket.on('client-connected', (onlineClientsUuid) => {
    Object.values(onlineClientsUuid).forEach(uuid => {

        const deviceStatus = document.querySelector(`tr[data-uuid="${uuid}"] #device-status-indicator`);
        if (deviceStatus) {

            deviceStatus.classList.remove('bg-red-500');
            deviceStatus.classList.add('bg-green-500');

            const deviceStatusText = document.querySelector(`tr[data-uuid="${uuid}"] #device-status-text`);
            deviceStatusText.textContent = 'Online';
        }
    })
})

socket.on('client-disconnected', (uuid) => {
    const deviceStatus = document.querySelector(`tr[data-uuid="${uuid}"] #device-status-indicator`);

    if (deviceStatus) {

        deviceStatus.classList.remove('bg-green-500');
        deviceStatus.classList.add('bg-red-500');

        const deviceStatusText = document.querySelector(`tr[data-uuid="${uuid}"] #device-status-text`);
        deviceStatusText.textContent = 'Offline';
    }
})

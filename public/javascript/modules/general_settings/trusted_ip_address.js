import { showSwalSuccessToast, showSwalErrorToast, confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";

export function initializeTrustedIpAddressForm() {
    const ipAddressInput = document.getElementById('trusted-ip-address');
    const networkNameInput = document.getElementById('network-name');

    document.querySelector("#trusted-ip-address-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const trustedIpAddress = ipAddressInput.value;
        const networkName = networkNameInput.value;

        if (!networkName || networkName === "") {
            networkNameInput.classList.remove("border-gray-300");
            networkNameInput.classList.add("border-red-500");
            return;
        }
        if (!trustedIpAddress || trustedIpAddress === "") {
            ipAddressInput.classList.remove("border-gray-300");
            ipAddressInput.classList.add("border-red-500");
            return;
        }

        try {
            const response = await fetch("/api/ip-address", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    networkName: networkName,
                    ipAddress: trustedIpAddress
                }),
            });

            const responseObject = await response.json();

            if (!response.ok) {
                showSwalErrorToast(responseObject.message);
                return;
            }

            event.target.reset();
            showSwalSuccessToast(responseObject.message);

            // add the new ip address to the table
            const table = document.getElementById("trusted-ip-address-table");
            if (table) {
                const tbody = table.querySelector('tbody');
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td class="text-gray-500 font-medium py-2 border-b text-sm border-gray-300 px-4">${networkName.toUpperCase()}</td>
                    <td class="text-gray-500 font-medium text-sm py-2 border-b border-gray-300 px-4">${trustedIpAddress}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4">
                        <button class="bg-red-500 text-white text-xs px-2 py-1 rounded-md remove-ip" data-ip="${trustedIpAddress}">Remove</button>
                    </td>
                `;
            }

        } catch (error) {
            console.error(error);
        }
    });


    // remove error border red
    ipAddressInput.addEventListener('click', function () {
        ipAddressInput.classList.remove('border-red-500');
        ipAddressInput.classList.add('border-gray-300');
    });

    networkNameInput.addEventListener('click', function () {
        networkNameInput.classList.remove('border-red-500');
        networkNameInput.classList.add('border-gray-300');
    });
}

const showTrustedIpAddressSpan = document.getElementById('show-trusted-ips');
const dataTableContainer = document.getElementById('data-table-container');
const displayTableData = document.getElementById('display-table-data');

export function showTrustedIpAddress() {

    showTrustedIpAddressSpan.addEventListener('click', async () => {
        dataTableContainer.classList.add('hidden');
        displayTableData.innerHTML = "";

        const ipAddress = await getAllIpAddress();

        // display ip address in table
        const table = createIpAddressTable(ipAddress);

        displayTableData.innerHTML = `
            <div class="w-full mb-5 text-center">
                <p class="text-xl text-gray-600 font-bold">Trusted IP Addresses</p>
            </div>
        `;

        displayTableData.appendChild(table);

        dataTableContainer.classList.remove('hidden');
        dataTableContainer.classList.add('block');
        dataTableContainer.classList.add('animate-slide-in');

        const displayedTable = document.getElementById("trusted-ip-address-table");
        if (displayedTable) {
            displayedTable.addEventListener('click', async (event) => {
                if (event.target.classList.contains('remove-ip')) {
                    const ipToRemove = event.target.getAttribute('data-ip');
                    const action = await confirmAlert(`Are you sure you want to remove ${ipToRemove}?`);

                    if (action.isConfirmed) {
                        console.log('deleting...');
                        const isDeleted = await removeIpAddress(ipToRemove);
                        if (isDeleted) event.target.closest('tr').remove();
                    }
                }
            });
        }

    });
}

async function getAllIpAddress() {
    const response = await fetch("/api/ip-address/all");
    const responseObject = await response.json();

    return responseObject.ipAddress;
}

// Function to create the table
function createIpAddressTable(ipAddresses) {
    const table = document.createElement('table');
    table.classList.add('table-auto', 'w-full', 'border-collapse', 'overflow-hidden', 'shadow-md', 'bg-white');
    table.id = "trusted-ip-address-table";

    // Create table header
    table.innerHTML = `
        <thead class="bg-blue-500 text-white">
            <tr>
                <th class="text-left py-3 px-4 font-medium">Network Name</th>
                <th class="text-left py-3 px-4 font-medium">IP Address</th>
                <th class="text-left py-3 px-4 font-medium">Actions</th>
            </tr>
        </thead>
        <tbody>
            ${ipAddresses.map(ip => `
                <tr class="hover:bg-gray-100">
                    <td class="text-gray-500 font-medium py-3 border-b text-sm border-gray-300 px-4">${ip.network_name}</td>
                    <td class="text-gray-500 font-medium text-sm py-3 border-b border-gray-300 px-4">${ip.ip_address}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4">
                        <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md remove-ip" data-ip="${ip.ip_address}">Remove</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    return table;
}


// Function to handle the removal of an IP address
async function removeIpAddress(ipAddress) {
    try {
        const response = await fetch("/api/ip-address", {
            method: "PUT",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ipAddress: ipAddress
            }),
        });

        const responseObject = await response.json();

        if (!response.ok) {
            showSwalErrorToast(responseObject.message);
            return false;
        }

        showSwalSuccessToast(responseObject.message);
        return true;
    } catch (error) {
        console.error(error);
        showSwalErrorToast(error.message);
    }
}


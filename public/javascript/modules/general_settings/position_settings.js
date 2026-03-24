import { showSwalSuccessToast, showSwalErrorToast, confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";

const positionInput = document.querySelector('#position');

export function initializePositionForm() {
    document.querySelector("#position-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const position = positionInput.value;

        if (!position || position === "") {
            positionInput.classList.add("border-red-500");
            return;
        }

        try {

            const response = await fetch("/api/position", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position }),
            });

            const responseObject = await response.json();

            if (!response.ok) {
                showSwalErrorToast(responseObject.message);
                return;
            }

            showSwalSuccessToast(responseObject.message);
            event.target.reset();

            const positionTable = document.getElementById("position-table");
            if (positionTable) {
                const tbody = positionTable.querySelector('tbody');
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td class="text-gray-500 font-medium py-2 border-b text-sm border-gray-300 px-4">${position}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4 text-center">
                        <button class="bg-red-500 text-white text-xs px-2 py-1 rounded-md remove-position" data-position-id="${responseObject.position_id}">Remove</button>
                    </td>
                `;
            }

        } catch (error) {
            console.error("Error adding position:", error);
            showSwalErrorToast("Failed to add position. Please try again.");
        }

    });
}

// remove error border red
positionInput.addEventListener('click', function () {
    positionInput.classList.remove('border-red-500');
    positionInput.classList.add('border-gray-300');
});

async function getAllPositions() {
    const response = await fetch("/api/position");
    const responseObject = await response.json();
    return responseObject.positions;
}

const showAllPositionsSpan = document.getElementById('show-all-positions');
const dataTableContainer = document.getElementById('data-table-container');
const displayTableData = document.getElementById('display-table-data');

export async function showAllPositions() {
    showAllPositionsSpan.addEventListener('click', async (event) => {
        dataTableContainer.classList.add('hidden');
        displayTableData.innerHTML = "";

        const positions = await getAllPositions();

        const table = createPositionTable(positions);
        displayTableData.innerHTML = `
            <div class="w-full mb-5 text-center">
                <p class="text-xl text-gray-600 font-bold">Positions</p>
            </div>
        `;
        displayTableData.appendChild(table);

        dataTableContainer.classList.remove('hidden');
        dataTableContainer.classList.add('block');
        dataTableContainer.classList.add('animate-slide-in');

        const displayedTable = document.getElementById("position-table");
        if (displayedTable) {
            displayedTable.addEventListener('click', async (event) => {
                if (event.target.classList.contains('remove-position')) {
                    const positionToRemove = event.target.getAttribute('data-position-id');
                    const action = await confirmAlert(`Are you sure you want to remove ${event.target.closest('tr').querySelector('td:first-child').textContent} Position?`);

                    if (action.isConfirmed) {
                        console.log(positionToRemove);

                        const isDeleted = await removePosition(positionToRemove);
                        if (isDeleted) event.target.closest('tr').remove();
                    }
                }
            });
        }
    });
}

function createPositionTable(positions) {
    const table = document.createElement('table');
    table.classList.add('w-full', 'mb-5', 'text-center');
    table.id = "position-table";

    table.innerHTML = `
        <thead class="bg-blue-500 text-white">
            <tr>
                <th class="text-center py-3 px-4 font-medium">Department Code</th>
                <th class="text-center py-3 px-4 font-medium">Actions</th>
            </tr>
        </thead>
        <tbody>
            ${positions.map(position => `
                <tr class="hover:bg-gray-100">
                    <td class="text-gray-500 text-center font-medium py-2 border-b text-sm border-gray-300 px-4">${position.position}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4 text-center">
                        <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md remove-department remove-position" data-position-id="${position.position_id}">Remove</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    return table;
}

async function removePosition(positionId) {
    try {
        const response = await fetch(`/api/position/${positionId}`, { method: "DELETE" });
        const responseObject = await response.json();

        if (!response.ok) {
            showSwalErrorToast(responseObject.message);
            return false;
        }

        showSwalSuccessToast(responseObject.message);
        return true;
    } catch (error) {
        console.error("Error removing position:", error);
        showSwalErrorToast("Failed to remove position. Please try again.");
        return false;
    }
}

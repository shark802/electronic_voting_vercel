import { showSwalSuccessToast, showSwalErrorToast, confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";

const departmentCodeInput = document.getElementById('department');
export function initializeDepartmentForm() {

    document.querySelector("#department-form").addEventListener("submit", async (event) => {
        event.preventDefault();

        const departmentCode = departmentCodeInput.value;

        if (!departmentCode || departmentCode === "") {
            departmentCodeInput.classList.remove("border-gray-300");
            departmentCodeInput.classList.add("border-red-500");
            return;
        }

        try {
            const response = await fetch("/api/department", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentCode }),
            });

            const responseObject = await response.json();

            if (!response.ok) {
                showSwalErrorToast(responseObject.message);
                return;
            }

            event.target.reset();
            showSwalSuccessToast(responseObject.message);

            // add the new department to the table
            const table = document.getElementById("department-table");
            if (table) {
                const tbody = table.querySelector('tbody');
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td class="text-gray-500 font-medium py-2 border-b text-sm border-gray-300 px-4">${departmentCode}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4">
                        <button class="bg-red-500 text-white text-xs px-2 py-1 rounded-md remove-department" data-department="${departmentCode}">Remove</button>
                    </td>
                `;
            }

            // // add the added department to the program form select option
            // const programDepartment = document.getElementById("program-department");
            // programDepartment.innerHTML += `<option value="${responseObject.department_id}">${departmentCode}</option>`;

            // // add the added department to the senator vote limit form select option
            // const departmentToSetVoteLimit = document.getElementById("department-to-set-vote-limit");
            // departmentToSetVoteLimit.innerHTML += `<option value="${responseObject.department_id}">${departmentCode}</option>`;

        } catch (error) {
            console.error("Error adding department:", error);
            showSwalErrorToast("Failed to add department. Please try again.");
        }
    });
}

// remove error border red
departmentCodeInput.addEventListener('click', function () {
    departmentCodeInput.classList.remove('border-red-500');
    departmentCodeInput.classList.add('border-gray-300');
});

async function getAllDepartments() {
    const response = await fetch("/api/departments");
    const responseObject = await response.json();
    return responseObject.departments;
}

const showAllDepartmentsSpan = document.getElementById('show-all-departments');
const dataTableContainer = document.getElementById('data-table-container');
const displayTableData = document.getElementById('display-table-data');

export async function showDepartmentTable() {

    showAllDepartmentsSpan.addEventListener('click', async (event) => {
        dataTableContainer.classList.add('hidden');
        displayTableData.innerHTML = "";

        const departments = await getAllDepartments();

        const table = createDepartmentTable(departments);

        displayTableData.innerHTML = `
            <div class="w-full mb-5 text-center">
                <p class="text-xl text-gray-600 font-bold">Departments</p>
            </div>
        `;
        displayTableData.appendChild(table);

        dataTableContainer.classList.remove('hidden');
        dataTableContainer.classList.add('block');
        dataTableContainer.classList.add('animate-slide-in');

        const displayedTable = document.getElementById("department-table");
        if (displayedTable) {
            displayedTable.addEventListener('click', async (event) => {
                if (event.target.classList.contains('remove-department')) {
                    const departmentToRemove = event.target.getAttribute('data-department-id');
                    const action = await confirmAlert(`Are you sure you want to remove ${event.target.closest('tr').querySelector('td:first-child').textContent} Department?`);

                    if (action.isConfirmed) {
                        const isDeleted = await removeDepartment(departmentToRemove);
                        if (isDeleted) {
                            event.target.closest('tr').remove();

                            // remove the added department from the program form select option
                            const programDepartment = document.getElementById("program-department");
                            programDepartment.innerHTML = programDepartment.innerHTML.replace(`<option value="${departmentToRemove}">${event.target.closest('tr').querySelector('td:first-child').textContent}</option>`, '');

                            // remove the added department from the senator vote limit form select option
                            const departmentToSetVoteLimit = document.getElementById("department-to-set-vote-limit");
                            departmentToSetVoteLimit.innerHTML = departmentToSetVoteLimit.innerHTML.replace(`<option value="${departmentToRemove}">${event.target.closest('tr').querySelector('td:first-child').textContent}</option>`, '');
                        }
                    }
                }
            });
        }
    });
}

function createDepartmentTable(departments) {
    const table = document.createElement('table');
    table.classList.add('w-full', 'mb-5', 'text-center');
    table.id = "department-table";

    table.innerHTML = `
        <thead class="bg-blue-500 text-white">
            <tr>
                <th class="text-center py-3 px-4 font-medium">Department Code</th>
                <th class="text-center py-3 px-4 font-medium">Actions</th>
            </tr>
        </thead>
        <tbody>
            ${departments.map(department => `
                <tr class="hover:bg-gray-100">
                    <td class="text-gray-500 text-center font-medium py-2 border-b text-sm border-gray-300 px-4">${department.department_code}</td>
                    <td class="py-2 border-b text-sm border-gray-300 px-4 text-center">
                        <button class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md remove-department" data-department-id="${department.department_id}">Remove</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    return table;
}

async function removeDepartment(departmentToRemove) {
    const response = await fetch(`/api/department/${departmentToRemove}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
    });

    const responseObject = await response.json();
    if (!response.ok) {
        showSwalErrorToast(responseObject.message);
        return false;
    }

    showSwalSuccessToast(responseObject.message);
    return true;
}



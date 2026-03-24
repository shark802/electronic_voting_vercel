import { showSwalSuccessToast, showSwalErrorToast } from "/javascript/helper/sweetAlertFunctions.js";

const departmentToSetVoteLimitInput = document.getElementById('department-to-set-vote-limit');
const senatorMaxVoteInput = document.getElementById('senator-max-vote');

export function initializeSenatorMaxVoteForm() {
    document.getElementById('set-vote-limit-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const departmentId = departmentToSetVoteLimitInput.value;
        const maxVote = senatorMaxVoteInput.value;

        if (!departmentId || departmentId === "") {
            departmentToSetVoteLimitInput.classList.remove("border-gray-300");
            departmentToSetVoteLimitInput.classList.add("border-red-500");
            return;
        }

        if (!maxVote || maxVote === "") {
            senatorMaxVoteInput.classList.remove("border-gray-300");
            senatorMaxVoteInput.classList.add("border-red-500");
            return;
        }

        try {
            const response = await fetch("/api/department/senator-max-vote", {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId, maxVote }),
            });

            const responseObject = await response.json();
            if (!response.ok) {
                console.log(responseObject);
                showSwalErrorToast(responseObject.message);
                return;
            }

            event.target.reset();
            showSwalSuccessToast(responseObject.message);

            if (document.querySelector('#department-max-vote-table')) {

                document.querySelector('#department-max-vote-table')
                    .querySelector('tbody')
                    .querySelectorAll('tr')
                    .forEach(row => {
                        if (row.querySelector('td:nth-child(2)').id === departmentId) {
                            row.querySelector('td:nth-child(2)').textContent = maxVote;
                        }
                    });
            }

        } catch (error) {
            console.error(error);
        }

    });
}

// remove error border red
departmentToSetVoteLimitInput.addEventListener('click', function () {
    departmentToSetVoteLimitInput.classList.remove('border-red-500');
    departmentToSetVoteLimitInput.classList.add('border-gray-300');
});

senatorMaxVoteInput.addEventListener('click', function () {
    senatorMaxVoteInput.classList.remove('border-red-500');
    senatorMaxVoteInput.classList.add('border-gray-300');
});

async function getAllDepartments() {
    const response = await fetch("/api/departments");
    const responseObject = await response.json();
    return responseObject.departments;
}

const showAllDepartmentsMaxVoteSpan = document.getElementById('show-all-max-votes');
const dataTableContainer = document.getElementById('data-table-container');
const displayTableData = document.getElementById('display-table-data');

export async function showAllDepartmentsMaxVote() {

    showAllDepartmentsMaxVoteSpan.addEventListener('click', async (event) => {
        dataTableContainer.classList.add('hidden');
        displayTableData.innerHTML = "";
        const departments = await getAllDepartments();
        const table = createDepartmentTable(departments);

        displayTableData.innerHTML = `
            <div class="w-full mb-5 text-center">
                <p class="text-xl text-gray-600 font-bold">Max Vote for Senators</p>
            </div>
        `;
        displayTableData.appendChild(table);

        dataTableContainer.classList.remove('hidden');
        dataTableContainer.classList.add('block');
        dataTableContainer.classList.add('animate-slide-in');
    });
}

function createDepartmentTable(departments) {
    const table = document.createElement('table');
    table.classList.add('table-auto', 'w-full', 'border-collapse', 'overflow-hidden', 'shadow-md', 'bg-white');
    table.id = "department-max-vote-table";

    table.innerHTML = `
        <thead class="bg-blue-500 text-white">
            <tr>
                <th class="text-center py-3 px-4 font-medium">Department</th>
                <th class="text-center py-3 px-4 font-medium">Max Vote</th>
            </tr>
        </thead>
        <tbody>
            ${departments.map(department => `
                <tr class="hover:bg-gray-100">
                    <td class="text-gray-500 text-center font-medium py-3 border-b text-sm border-gray-300 px-4">${department.department_code}</td>
                    <td id="${department.department_id}" class="py-3 border-b font-medium border-gray-300 px-4 text-center">${department.max_select_senator}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    return table;
}





import { showSwalSuccessToast, showSwalErrorToast, confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";

const programDepartmentSelect = document.getElementById('program-department');
const programInput = document.getElementById('program');

export function initializeProgramForm() {
    document.getElementById('program-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const departmentId = programDepartmentSelect.value;
        const programCode = programInput.value;

        if (!departmentId || departmentId === "") {
            programDepartmentSelect.classList.remove('border-gray-300');
            programDepartmentSelect.classList.add('border-red-500');
            return;
        }

        if (!programCode || programCode === "") {
            programInput.classList.remove('border-gray-300');
            programInput.classList.add('border-red-500');
            return;
        }

        try {
            const response = await fetch('/api/program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId, programCode })
            });

            const responseObject = await response.json();

            if (!response.ok) {
                showSwalErrorToast(responseObject.message);
                return;
            }

            showSwalSuccessToast(responseObject.message);
            event.target.reset();

            const table = document.getElementById(`program-table-${departmentId}`);
            if (table) {
                const tbody = table.querySelector('tbody');
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td class="p-2 border-b border-gray-300 text-sm">${programCode}</td>
                    <td class="p-2 border-b border-gray-300 text-sm">
                        <button data-program-id="${responseObject.program_id}" class="bg-red-500 text-white px-2 py-1 rounded-md remove-program">Delete</button>
                    </td>   
                `;
            }


        } catch (error) {
            showSwalErrorToast('An error occurred while adding the program.');
        }

    });
}

// remove the border red when the user input something
programDepartmentSelect.addEventListener('input', () => {
    programDepartmentSelect.classList.remove('border-red-500');
    programDepartmentSelect.classList.add('border-gray-300');
});

programInput.addEventListener('input', () => {
    programInput.classList.remove('border-red-500');
    programInput.classList.add('border-gray-300');
});

async function getAllDepartments() {
    const response = await fetch('/api/departments');
    const responseObject = await response.json();
    return responseObject.departments;
}

async function getAllPrograms() {
    const response = await fetch('/api/programs');
    const responseObject = await response.json();
    return responseObject.programs;
}

const showAllProgramsSpan = document.getElementById('show-all-programs');
const dataTableContainer = document.getElementById('data-table-container');
const displayTableData = document.getElementById('display-table-data');

export async function showAllProgramsTable() {
    showAllProgramsSpan.addEventListener('click', async () => {
        dataTableContainer.classList.add('hidden');
        displayTableData.innerHTML = "";

        const programs = await getAllPrograms();
        const departments = await getAllDepartments();

        departments.forEach(department => {

            const departmentPrograms = programs.filter(program => program.department === department.department_id);
            if (departmentPrograms.length <= 0) return;

            const table = createProgramTable(departmentPrograms);
            displayTableData.innerHTML += `
            <div class="w-full mb-2 mt-10 text-left">
                <p class="text-lg text-gray-700 font-semibold">${department.department_code} Department Programs</p>
            </div>
        `;
            displayTableData.appendChild(table);

            dataTableContainer.classList.remove('hidden');
            dataTableContainer.classList.add('block');
            dataTableContainer.classList.add('animate-slide-in');
        });

        document.querySelectorAll('table').forEach(table => {
            table.addEventListener('click', async (event) => {
                if (event.target.classList.contains('remove-program')) {
                    const programToRemove = event.target.getAttribute('data-program-id');
                    const action = await confirmAlert(`Are you sure you want to remove ${event.target.closest('tr').querySelector('td:first-child').textContent} Program?`);

                    if (action.isConfirmed) {
                        const isDeleted = await removeProgram(programToRemove);
                        if (isDeleted) event.target.closest('tr').remove();
                    }
                }
            });
        })

    });
}

function createProgramTable(programs) {
    const table = document.createElement('table');
    table.classList.add('w-full', 'border-collapse', 'border', 'border-gray-300', 'overflow-hidden', 'mb-5');
    table.id = `program-table-${programs[0].department}`;
    table.innerHTML = `
        <thead>
            <tr>
                <th class="bg-blue-500 text-white text-left p-2">Program Code</th>
                <th class="bg-blue-500 text-white text-left p-2">Action</th>
            </tr>
        </thead>
        <tbody>
            ${programs.map(program => `
                <tr class="hover:bg-gray-100">
                    <td class="p-2 border-b border-gray-300 text-sm">${program.program_code}</td>
                    <td class="p-2 border-b border-gray-300 text-sm">
                        <button data-program-id="${program.program_id}" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md remove-program text-xs">Delete</button>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    return table;
}

async function removeProgram(programId) {
    try {
        const response = await fetch(`/api/program/${programId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const responseObject = await response.json();

        if (!response.ok) {
            showSwalErrorToast(responseObject.message);
            return false;
        }

        showSwalSuccessToast(responseObject.message);
        return true;

    } catch (error) {
        showSwalErrorToast('An error occurred while removing the program.');
        return false;
    }
}


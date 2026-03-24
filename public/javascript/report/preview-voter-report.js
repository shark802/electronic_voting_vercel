import { confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";
import "/javascript/socket_io.js"
document.getElementById('show-sidebar').addEventListener('click', function () {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
});

document.getElementById('close-sidebar').addEventListener('click', function () {
    document.getElementById('sidebar').classList.add('-translate-x-full');
});

const infoIcon = document.getElementById('info-icon');
const tooltip = document.getElementById('tooltip');

infoIcon.addEventListener('mouseenter', function () {
    tooltip.classList.remove('hidden');
});

infoIcon.addEventListener('mouseleave', function () {
    tooltip.classList.add('hidden');
});

const infoIconProgram = document.getElementById('info-icon-program'); // Updated to match new ID
const tooltipProgram = document.getElementById('tooltip-program');

infoIconProgram.addEventListener('mouseenter', function () {
    tooltipProgram.classList.remove('hidden');
});

infoIconProgram.addEventListener('mouseleave', function () {
    tooltipProgram.classList.add('hidden');
});

const voteStatusSelectElement = document.body.querySelector('#voteStatus');
const departmentSelectElement = document.body.querySelector('#department');
const programSelectElement = document.body.querySelector('#program');
const yearLevelSelectElement = document.body.querySelector('#year_level');
const sectionSelectElement = document.body.querySelector('#section');

if (!departmentSelectElement.value) {
    // disable the select element to choose program if no department is selected
    programSelectElement.disabled = true;
}

// When select element change the program option is updated
departmentSelectElement.addEventListener('input', async (event) => {
    try {
        const newSelectedDepartment = event.target.value;

        if (newSelectedDepartment === '') {
            while (programSelectElement.options.length > 1) {
                programSelectElement.remove(1);  // Remove option at index 1 repeatedly
            }

            programSelectElement.disabled = true;

            while (sectionSelectElement.options.length > 1) {
                sectionSelectElement.remove(1);  // Remove option at index 1 repeatedly
            }

            sectionSelectElement.disabled = true;
            return;
        }
        programSelectElement.disabled = false;

        // update optons for programs select
        const newProgramOptions = await fetchDepartmentPograms(newSelectedDepartment);

        while (programSelectElement.options.length > 1) {
            programSelectElement.remove(1);  // Remove option at index 1 repeatedly
        }

        newProgramOptions.forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option;
            newOption.textContent = option;
            programSelectElement.appendChild(newOption); // append the new program option of new department selected 
        });

    } catch (error) {
        console.log(error.message);
    }

});

// When selected a program add option to select section for that program
programSelectElement.addEventListener('input', async (event) => {
    try {
        const newSelectedProgram = event.target.value;

        if (newSelectedProgram === '') {
            while (sectionSelectElement.options.length > 1) {
                sectionSelectElement.remove(1);  // Remove option at index 1 repeatedly
            }

            sectionSelectElement.disabled = true;
            return;
        }
        sectionSelectElement.disabled = false;

        // update optons for programs select
        const newSectionOptions = await fetchProgramSection(newSelectedProgram);

        while (sectionSelectElement.options.length > 1) {
            sectionSelectElement.remove(1);  // Remove option at index 1 repeatedly
        }

        newSectionOptions.forEach(option => {
            const newOption = document.createElement('option');
            newOption.value = option;
            newOption.textContent = option;
            sectionSelectElement.appendChild(newOption); // append the new program option of new department selected 
        });

    } catch (error) {
        console.log(error.message);
    }

})


async function fetchDepartmentPograms(newSelectedDepartment) {
    const response = await fetch(`/api/program?department=${newSelectedDepartment}`);
    const responseObject = await response.json();
    const departmentProgramList = responseObject.programs;

    return departmentProgramList; // return list of programs under of the selected department
}

async function fetchProgramSection(newSelectedProgram) {
    const response = await fetch(`/api/section?program=${newSelectedProgram}`);
    const responseObject = await response.json();
    const programSectionList = responseObject.sections;

    return programSectionList; // return list of programs under of the selected department
}

document.body.querySelector('#generate-pdf').addEventListener('click', async (event) => {
    try {

        const action = await confirmAlert('Do you want to generate a PDF report?');
        if (!action.isConfirmed) return;

        const electionId = document.querySelector('#election-id').value;
        const filterForm = document.querySelector('#filter-form');
        const formData = new FormData(filterForm);

        const urlWithParams = new URLSearchParams(formData);
        // await fetch(`/api/pdf-report/voter/${electionId}?${urlWithParams.toString()}`);

        window.location.href = `/api/pdf-report/voter/${electionId}?${urlWithParams.toString()}`

    } catch (error) {
        console.error(error);

    }
})
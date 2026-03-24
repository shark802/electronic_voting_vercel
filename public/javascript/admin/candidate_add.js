import "/javascript/logout.js";
import "/javascript/modules/candidates/candidate_add_default_election.js";
import { changeEventListener } from "/javascript/helper/changeEventListener.js";
import { isInputNotEmpty } from "/javascript/formInputValidator/isInputNotEmpty.js";
import { showSwalErrorToast, confirmErrorAlert } from "/javascript/helper/sweetAlertFunctions.js";
import { showLoading, hideLoader } from "/javascript/helper/loader.js";
import socket from "/javascript/socket_io.js"

const candidate_nav = document.querySelector("#candidate_nav");
const add_candidate = document.querySelector("#add_candidate");

candidate_nav.classList.remove("font-normal");
candidate_nav.classList.add("active-page");

$("#candidate_subpage").show();

add_candidate.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

// Form Input Element
const election = document.querySelector("#election");
const idNumber = document.querySelector("#id-number");
const firstname = document.querySelector("#firstname");
const lastname = document.querySelector("#lastname");
// const alias = document.querySelector("#alias");
const program = document.querySelector("#program");
const party = document.querySelector("#party");
const position = document.querySelector("#position");

// Input Error Messsage element
const electionErrorMessage = document.querySelector("#electionErrorMessage");
const idNumberErrorMessage = document.querySelector("#idNumberErrorMessage");
const firstnameErrorMessage = document.querySelector("#firstnameErrorMessage");
const lastnameErrorMessage = document.querySelector("#lastnameErrorMessage");
// const aliasErrorMessage = document.querySelector("#aliasErrorMessage");
const programErrorMessage = document.querySelector("#programErrorMessage");
const partyErrorMessage = document.querySelector("#partyErrorMessage");
const positionErrorMessage = document.querySelector("#positionErrorMessage");

changeEventListener(isInputNotEmpty, [election], electionErrorMessage);
changeEventListener(isInputNotEmpty, [idNumber], idNumberErrorMessage);
changeEventListener(isInputNotEmpty, [firstname], firstnameErrorMessage);
changeEventListener(isInputNotEmpty, [lastname], lastnameErrorMessage);
// changeEventListener(isInputNotEmpty, [alias], aliasErrorMessage);
changeEventListener(isInputNotEmpty, [program], programErrorMessage);
changeEventListener(isInputNotEmpty, [party], partyErrorMessage);
changeEventListener(isInputNotEmpty, [position], positionErrorMessage);

document.querySelector("#candidate-form").addEventListener('submit', async (event) => {
    event.preventDefault();

    const addCandidateForm = new FormData(event.target)

    for (let [key, value] of addCandidateForm.entries()) {
        console.log(`${key}: ${value}`);
    }

    if (
        !isInputNotEmpty([election], electionErrorMessage) ||
        !isInputNotEmpty([idNumber], idNumberErrorMessage) ||
        !isInputNotEmpty([firstname], firstnameErrorMessage) ||
        !isInputNotEmpty([lastname], lastnameErrorMessage) ||
        !isInputNotEmpty([program], programErrorMessage) ||
        !isInputNotEmpty([party], partyErrorMessage) ||
        !isInputNotEmpty([position], positionErrorMessage)
    ) {
        Swal.fire({
            toast: true,
            position: "top",
            timer: 5000,
            title: "Oops, something wasn't right, The form has error!",
            icon: "error",
            showConfirmButton: false
        });
        return;
    }

    try {

        showLoading()
        const response = await fetch("/api/candidate", {
            method: "POST",
            body: addCandidateForm
        })

        hideLoader()
        if (!response.ok) {
            const responseObject = await response.json();
            Swal.fire({
                title: responseObject.name,
                text: responseObject.message,
                icon: "error",
            });
            return;
        } else {
            Swal.fire({
                title: "New Candidate added successfully",
                icon: "success",
            }).then(action => {
                if (action.isConfirmed) {
                    event.target.reset();
                    // Reset image preview
                    imagePreview.src = "/placeholder.svg";
                    imagePreview.classList.add("hidden");
                    imagePlaceholder.classList.remove("hidden");
                    // Reset file input
                    fileInput.value = "";
                }
            })
            return;
        }

    } catch (error) {
        console.error(error);
    }

})

document.body.querySelector('#id-number').addEventListener('change', async (event) => {
    try {

        const idNumber = event.target.value.trim();

        showLoading();
        const response = await fetch(`/api/user/${idNumber}`);
        hideLoader();

        const responseObject = await response.json();

        if (response.status === 404) return confirmErrorAlert(`User ${idNumber} has no record in the system`)
        if (!response.ok) return showSwalErrorToast(responseObject.message);

        const user = responseObject.user;

        const form = document.body.querySelector('#candidate-form');
        form.querySelector('#firstname').value = user.firstname
        form.querySelector('#lastname').value = user.lastname;

        await assignDepartment(user.course)

    } catch (error) {
        console.error(error);

    }
})

async function assignDepartment(userCourse) {
    const departmentObject = await fetchDepartmentObject();

    for (const [department, programs] of Object.entries(departmentObject)) {
        if (programs.find(program => userCourse === program)) {

            const departmentOption = document.body.querySelector('#program').querySelectorAll('option');
            for (let courseOption of departmentOption) {

                if (courseOption.value === department) {
                    courseOption.selected = true;
                    break;
                }
            }

        }
    }

}

async function fetchDepartmentObject() {
    try {

        const response = await fetch('/api/department');

        if (response.ok) {
            const responseObject = await response.json();
            return responseObject.DEPARTMENT;
        }

    } catch (error) {
        console.error(error);

    }
}
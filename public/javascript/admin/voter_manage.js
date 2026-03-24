import "/javascript/logout.js"
import "/javascript/socket_io.js"

const voter_nav = document.querySelector("#voter_nav")
const manage_voter_nav = document.querySelector("#manage_voter_nav")

voter_nav.classList.remove("font-normal")
voter_nav.classList.add("active-page")

$("#voter_subpage").slideDown(500)

manage_voter_nav.classList.add("active-nav");

// Hide Sidebar
document.querySelector("#show-sidebar").addEventListener("click", () => {
    $("#sidebar").show(100);
});
// Show Sidebar
document.querySelector("#hide-sidebar").addEventListener('click', () => {
    $("#sidebar").hide(100);
});

filterVotedUserByElection();
searchUser();
clearSearch()

function filterVotedUserByElection() {
    const selectElement = document.querySelector('#filter-by-election');
    selectElement.addEventListener('change', async () => {

        const form = document.querySelector('#filter-voted-users-form');
        if (form) {
            console.log('submit');
            return form.submit();
        }
    })
}

function clearSearch() {
    const searchInput = document.querySelector('#search-user');
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === "") return document.querySelector('#filter-voted-users-form').submit();
    })
}

function searchUser() {
    const searchUserForm = document.querySelector('#filter-voted-users-form');
    searchUserForm.addEventListener('submit', () => {
        if (document.querySelector('#search-user').value.trim() === "") {
            document.querySelector('#search-user').value = "";
            return
        };
        searchUser.submit();
    })
}

document.addEventListener('DOMContentLoaded', () => {
    const searchParams = new URLSearchParams(window.location.search);
    const selectedElection = searchParams.get('election');

    document.querySelector('#filter-by-election').querySelectorAll('option').forEach(option => {
        if (option.value === selectedElection) {
            return option.selected = true;
        }
    })
})

document.addEventListener('DOMContentLoaded', () => {
    const searchParams = new URLSearchParams(window.location.search);
    const userId = searchParams.get('user_id');

    document.querySelector('#search-user').value = userId;
})
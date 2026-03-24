import { showSwalErrorToast } from "/javascript/helper/sweetAlertFunctions.js";
import { showLoading, hideLoader } from "/javascript/helper/loader.js";
import { confirmAlert } from "/javascript/helper/sweetAlertFunctions.js";
import "/javascript/socket_io.js"

document.querySelector("#ballot-form").addEventListener('submit', async (event) => {
    event.preventDefault();

    const selectedCandidate = getSelectedCandidatePerPosition(event);

    // If validation failed, don't proceed
    if (selectedCandidate.length === 0) {
        return;
    }

    try {
        const candidateObjectArray = await fetchSelectedCandidateInfo(selectedCandidate); // fetch info of candidate selected
        displayConfirmVoteModal(candidateObjectArray); // display the candidate info to confirm

        const confirmModal = document.getElementById('confirm-modal');
        confirmModal.addEventListener('click', async (event) => {
            if (event.target.id === "cancel-vote") {
                confirmModal.close();
                confirmModal.remove();
            } else if (event.target.id === "submit-vote") {

                confirmModal.close();
                confirmModal.remove();
                const response = await submitVote(selectedCandidate);
                const responseObject = await response.json();

                if (!response.ok) return showSwalErrorToast(responseObject.message);

                const action = await confirmAlert(responseObject.message);
                if (action.isConfirmed) {
                    window.location.href = "/election?isVoted=true";
                }
            }
        }, { once: true });
    } catch (error) {
        console.error(error);
    }
});

/* Helper Functions */

// Retrieves voter selected candidates after submitting the ballot form.
// Returns an object mapping position labels (as keys) to the values of the selected candidates' id numbers.
function getSelectedCandidatePerPosition(event) {
    let castedVote = [];
    let hasError = false;

    event.target.querySelectorAll("section").forEach(position => {
        const positionCandidateRun = position.querySelector('#position-label').textContent.trim();
        const errorMessageContainer = document.getElementById(`error-${positionCandidateRun}`);

        // Clear previous error messages
        errorMessageContainer.style.display = 'none';
        errorMessageContainer.textContent = '';

        if (positionCandidateRun === 'SENATOR') {
            const senatorSelectedCandidates = position.querySelectorAll('input[type=checkbox]:checked');
            const maxVotes = parseInt(position.dataset.maxVote) || 12; // Default to 12 if not set
            const selectedCount = senatorSelectedCandidates.length;
            const totalAvailableCandidates = position.querySelectorAll('input[type=checkbox]').length;

            // Add selected senators to vote array
            Array.from(senatorSelectedCandidates).forEach(candidate => {
                castedVote.push({
                    position: positionCandidateRun,
                    id_number: candidate.value
                });
            });

            // Validate senator selection count
            if (selectedCount === 0) {
                hasError = true;
                showError(positionCandidateRun, `Please select candidate(s) for ${positionCandidateRun}.`);
            } else if (selectedCount > maxVotes) {
                hasError = true;
                showError(positionCandidateRun, `You can only select up to ${maxVotes} candidates for ${positionCandidateRun}. Currently selected: ${selectedCount}.`);
            } else if (selectedCount < maxVotes && selectedCount < totalAvailableCandidates) {
                // Only show error if there are more candidates available than selected
                hasError = true;
                showError(positionCandidateRun, `Please select all available candidates for ${positionCandidateRun}. Currently selected: ${selectedCount} of ${totalAvailableCandidates}.`);
            } else {
                // Clear error if requirements are satisfied
                clearError(positionCandidateRun);
            }
        } else {
            const selectedCandidate = position.querySelector('input[type=radio]:checked');
            if (!selectedCandidate) {
                hasError = true;
                showError(positionCandidateRun, `Please select a candidate for ${positionCandidateRun}.`);
            } else {
                castedVote.push({
                    position: positionCandidateRun,
                    id_number: selectedCandidate.value
                });
                clearError(positionCandidateRun);
            }
        }
    });

    if (hasError) {
        return []; // Return an empty array to indicate failure
    }

    return castedVote;
}

function displayConfirmVoteModal(candidateObjectArray) {
    hideLoader();

    if (!candidateObjectArray || candidateObjectArray.length < 1) return;

    // Define the desired order
    const positionOrder = ['PRESIDENT', 'VICE PRESIDENT', 'SENATOR'];

    // Sort the candidates according to the defined position order
    candidateObjectArray.sort((a, b) => {
        return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });

    const confirmModal = document.createElement('dialog');
    confirmModal.id = "confirm-modal";
    confirmModal.classList.add('confirm-modal', 'bg-white', 'rounded-lg', 'shadow-xl', 'p-6', 'max-w-md', 'w-full', 'mx-auto', 'mx-4');
    document.body.append(confirmModal);

    confirmModal.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="lg:text-2xl text-lg font-bold text-gray-800">Please Confirm Your Vote</h2>
            <p class="text-gray-600 text-sm lg:text-base mt-2">Review your selections before casting your vote</p>
        </div>
        <div class="space-y-4 mb-6 text-sm lg:text-base">
            ${candidateObjectArray.map(candidateObject => `
                <div class="bg-gray-100 p-3 rounded-md">
                    <p class="text-gray-500 text-sm font-medium">${candidateObject.position}</p>
                    <p class="text-gray-800 font-semibold">${candidateObject.firstname} ${candidateObject.lastname}</p>
                </div>
            `).join('')}
        </div>
        <div class="flex justify-end space-x-4">
            <button id="cancel-vote" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
            <button id="submit-vote" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">Cast Vote</button>
        </div>
    `;

    confirmModal.showModal();
}

// Send request to fetch candidate info of selected candidate
async function fetchSelectedCandidateInfo(selectedCandidateObject) {
    try {
        const electionIdInUrl = window.location.href.split("/");
        let electionId = electionIdInUrl[electionIdInUrl.length - 1]

        const urlParams = selectedCandidateObject.map(candidate => `id_number=${candidate.id_number}`).join('&');
        const url = `/api/candidate-info?electionId=${electionId}&${urlParams}`

        showLoading();
        const response = await fetch(url);
        const responseObject = await response.json();
        if (!response.ok) {
            return showSwalErrorToast(responseObject.message)
        }

        return responseObject;
    } catch (error) {
        console.error(error);
    }
}

async function submitVote(selectedCandidate) {
    try {
        showLoading();
        let urlPath = window.location.href.split('/');
        const electionId = urlPath[urlPath.length - 1]

        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedCandidate, electionId })
        });

        hideLoader();
        return response;
    } catch (error) {
        console.error(error);
    }
}

// Enhanced checkbox limitation with real-time feedback
document.addEventListener('DOMContentLoaded', () => {
    // Handle senator section
    const senatorSection = document.querySelector('section[data-max-vote]');
    if (senatorSection) {
        senatorSection.addEventListener('change', (event) => {
            if (event.target.matches('input[type="checkbox"]')) {
                limitCheckboxSelection(event.target);
                updateSelectionCounter(event.target);
                validateSenatorSelection(event.target);
            }
        });

        // Initialize counter display
        updateSelectionCounter(senatorSection.querySelector('input[type="checkbox"]'));
    }

    // Handle radio button sections
    document.querySelectorAll('section:not([data-max-vote])').forEach(section => {
        section.addEventListener('change', (event) => {
            if (event.target.matches('input[type="radio"]')) {
                validateRadioSelection(event.target);
            }
        });
    });
});

function limitCheckboxSelection(checkboxElement) {
    const section = checkboxElement.closest('section');
    const maxVotes = parseInt(section.dataset.maxVote) || 12;
    const selectedCheckboxes = section.querySelectorAll('input[type="checkbox"]:checked');

    if (checkboxElement.checked && selectedCheckboxes.length > maxVotes) {
        // Prevent exceeding max votes by unchecking the current checkbox
        checkboxElement.checked = false;

        // Show error message
        const positionLabel = section.querySelector('#position-label').textContent.trim();
        const errorContainer = document.getElementById(`error-${positionLabel}`);
        if (errorContainer) {
            errorContainer.textContent = `Maximum ${maxVotes} candidates can be selected for ${positionLabel}.`;
            errorContainer.style.display = 'block';

            // Clear error after 3 seconds
            setTimeout(() => {
                errorContainer.style.display = 'none';
                errorContainer.textContent = '';
            }, 3000);
        }
    }
}

function updateSelectionCounter(checkboxElement) {
    if (!checkboxElement) return;

    const section = checkboxElement.closest('section');
    const maxVotes = parseInt(section.dataset.maxVote) || 12;
    const selectedCount = section.querySelectorAll('input[type="checkbox"]:checked').length;

    // Find or create counter display
    let counterElement = section.querySelector('.selection-counter');
    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.className = 'text-sm text-blue-300 selection-counter';

        // Insert after the position label
        const positionLabel = section.querySelector('#position-label');
        if (positionLabel && positionLabel.parentNode) {
            positionLabel.parentNode.insertBefore(counterElement, positionLabel.nextSibling);
        }
    }

    // Update counter text with color coding
    const isExact = selectedCount === maxVotes;
    const isOver = selectedCount > maxVotes;
    const isUnder = selectedCount > 0 && selectedCount < maxVotes;

    let colorClass = 'text-blue-100';
    if (isExact) {
        colorClass = 'text-blue-100 font-semibold';
    }

    counterElement.innerHTML = `Selected: <span class="${colorClass}">${selectedCount}</span> / ${maxVotes} ${isExact ? '✓' : isUnder ? '(need more)' : isOver ? '(too many)' : ''}`;
}

function validateRadioSelection(radioElement) {
    const section = radioElement.closest('section');
    const positionLabel = section.querySelector('#position-label').textContent.trim();
    const selectedCandidate = section.querySelector('input[type=radio]:checked');

    if (selectedCandidate) {
        clearError(positionLabel);
    }
}

function validateSenatorSelection(checkboxElement) {
    const section = checkboxElement.closest('section');
    const positionLabel = section.querySelector('#position-label').textContent.trim();
    const maxVotes = parseInt(section.dataset.maxVote) || 12;
    const selectedCount = section.querySelectorAll('input[type="checkbox"]:checked').length;
    const totalAvailableCandidates = section.querySelectorAll('input[type="checkbox"]').length;

    // Clear error if requirements are satisfied
    if (selectedCount > 0 && selectedCount <= maxVotes && (selectedCount === totalAvailableCandidates || selectedCount === maxVotes)) {
        clearError(positionLabel);
    }
}

function showError(position, message) {
    const errorElement = document.getElementById(`error-${position}`);
    const section = Array.from(document.querySelectorAll('section')).find(section =>
        section.querySelector('#position-label')?.textContent.trim() === position
    );

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('animate-pulse');
    }

    if (section) {
        // Add error styling to the section
        section.classList.add('error-section');
        section.style.borderColor = '#ef4444'; // red-500
        section.style.backgroundColor = '#fef2f2'; // red-50

        // Add error styling to the header
        const header = section.querySelector('.bg-gradient-to-r');
        if (header) {
            header.classList.add('error-header');
            header.style.background = 'linear-gradient(to right, #ef4444, #dc2626)'; // red-500 to red-600
        }

        // Add error styling to the candidates container
        const candidatesContainer = section.querySelector('.p-4.bg-white');
        if (candidatesContainer) {
            candidatesContainer.style.backgroundColor = '#fef2f2'; // red-50
            candidatesContainer.style.transition = 'background-color 0.3s ease';
        }
    }
}

function clearError(position) {
    const errorElement = document.getElementById(`error-${position}`);
    const section = Array.from(document.querySelectorAll('section')).find(section =>
        section.querySelector('#position-label')?.textContent.trim() === position
    );

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        errorElement.classList.remove('animate-pulse');
    }

    if (section) {
        // Remove error styling from the section
        section.classList.remove('error-section');
        section.style.borderColor = '';
        section.style.backgroundColor = '';

        // Remove error styling from the header
        const header = section.querySelector('.bg-gradient-to-r');
        if (header) {
            header.classList.remove('error-header');
            header.style.background = '';
        }

        // Remove error styling from the candidates container
        const candidatesContainer = section.querySelector('.p-4.bg-white');
        if (candidatesContainer) {
            candidatesContainer.style.backgroundColor = '';
        }
    }
}

// Add CSS styles for error animations
const style = document.createElement('style');
style.textContent = `
    .error-section {
        transition: all 0.3s ease;
    }
    
    .error-header {
        transition: all 0.3s ease;
    }
    
    @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }
    
    .error-section {
        animation: errorShake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

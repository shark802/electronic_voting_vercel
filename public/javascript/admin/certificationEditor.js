document.addEventListener('DOMContentLoaded', async function () {
    let preparedByCount = 0;
    let notedByCount = 0;
    let approvedByCount = 0;

    // Function to create an entry
    function createEntry(containerId, index, name = '', position = '') {
        const entry = document.createElement('div');
        entry.className = 'p-4 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md';
        entry.innerHTML = `
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Name ${index + 1}</label>
                    <input type="text" id="${containerId}Name${index}" name="${containerId}Name${index}" 
                        class="w-full px-3 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        value="${name}"
                        placeholder="Enter name"
                        >
                </div>
                <div class="space-y-2">
                    <label class="block text-sm font-medium text-gray-700">Position ${index + 1}</label>
                    <input type="text" id="${containerId}Position${index}" name="${containerId}Position${index}" 
                        class="w-full px-3 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        value="${position}"
                        placeholder="Enter position"
                        >
                </div>
                <div class="col-span-2 flex justify-end">
                    <button type="button" class="remove-entry inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200">
                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `;

        // Add remove functionality
        const removeButton = entry.querySelector('.remove-entry');
        removeButton.addEventListener('click', () => {
            entry.classList.add('opacity-0', 'transform', 'scale-95');
            setTimeout(() => {
                entry.remove();
                switch (containerId) {
                    case 'preparedBy':
                        preparedByCount--;
                        break;
                    case 'notedBy':
                        notedByCount--;
                        break;
                    case 'approvedBy':
                        approvedByCount--;
                        break;
                }
                updateNumbers(containerId);
            }, 200);
        });

        return entry;
    }

    // Function to update the numbers in labels
    function updateNumbers(containerId) {
        const container = document.getElementById(`${containerId}Container`);
        const entries = container.querySelectorAll('.grid');
        entries.forEach((entry, index) => {
            const nameLabel = entry.querySelector('label:first-child');
            const positionLabel = entry.querySelector('label:nth-child(2)');
            nameLabel.textContent = `Name ${index + 1}`;
            positionLabel.textContent = `Position ${index + 1}`;
        });
    }

    // Add new entry functions
    document.getElementById('addPreparedBy').addEventListener('click', () => {
        const container = document.getElementById('preparedByContainer');
        const entry = createEntry('preparedBy', preparedByCount);
        entry.style.opacity = '0';
        entry.style.transform = 'scale(0.95)';
        container.appendChild(entry);
        requestAnimationFrame(() => {
            entry.style.opacity = '1';
            entry.style.transform = 'scale(1)';
        });
        preparedByCount++;
    });

    document.getElementById('addNotedBy').addEventListener('click', () => {
        const container = document.getElementById('notedByContainer');
        const entry = createEntry('notedBy', notedByCount);
        entry.style.opacity = '0';
        entry.style.transform = 'scale(0.95)';
        container.appendChild(entry);
        requestAnimationFrame(() => {
            entry.style.opacity = '1';
            entry.style.transform = 'scale(1)';
        });
        notedByCount++;
    });

    document.getElementById('addApprovedBy').addEventListener('click', () => {
        const container = document.getElementById('approvedByContainer');
        const entry = createEntry('approvedBy', approvedByCount);
        entry.style.opacity = '0';
        entry.style.transform = 'scale(0.95)';
        container.appendChild(entry);
        requestAnimationFrame(() => {
            entry.style.opacity = '1';
            entry.style.transform = 'scale(1)';
        });
        approvedByCount++;
    });

    try {
        // Fetch certification details from API
        const response = await fetch('/api/certification');
        if (!response.ok) {
            throw new Error('Failed to fetch certification details');
        }
        const certificationDetails = await response.json();

        // Populate prepared by fields
        const preparedByContainer = document.getElementById('preparedByContainer');
        if (Array.isArray(certificationDetails.preparedBy)) {
            certificationDetails.preparedBy.forEach((person, index) => {
                preparedByContainer.appendChild(createEntry('preparedBy', index, person.name, person.position));
                preparedByCount++;
            });
        } else {
            // Handle single entry
            preparedByContainer.appendChild(createEntry('preparedBy', 0,
                certificationDetails.preparedBy.name,
                certificationDetails.preparedBy.position));
            preparedByCount++;
        }

        // Populate noted by fields
        const notedByContainer = document.getElementById('notedByContainer');
        certificationDetails.notedBy.forEach((person, index) => {
            notedByContainer.appendChild(createEntry('notedBy', index, person.name, person.position));
            notedByCount++;
        });

        // Populate approved by fields
        const approvedByContainer = document.getElementById('approvedByContainer');
        if (Array.isArray(certificationDetails.approvedBy)) {
            certificationDetails.approvedBy.forEach((person, index) => {
                approvedByContainer.appendChild(createEntry('approvedBy', index, person.name, person.position));
                approvedByCount++;
            });
        } else {
            // Handle single entry
            approvedByContainer.appendChild(createEntry('approvedBy', 0,
                certificationDetails.approvedBy.name,
                certificationDetails.approvedBy.position));
            approvedByCount++;
        }

    } catch (error) {
        console.error('Error loading certification details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load certification details. Please try again.',
            confirmButtonColor: '#3085d6'
        });
    }

    // Handle form submission
    document.getElementById('certificationForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        try {
            // Validate form data
            const validateEntries = (containerId) => {
                const container = document.getElementById(`${containerId}Container`);
                const entries = container.querySelectorAll('.grid');
                let isValid = true;
                let emptyFields = [];

                entries.forEach((entry, index) => {
                    const nameInput = entry.querySelector(`input[id^="${containerId}Name"]`);
                    const positionInput = entry.querySelector(`input[id^="${containerId}Position"]`);

                    if (!nameInput.value.trim() || !positionInput.value.trim()) {
                        isValid = false;
                        emptyFields.push(index + 1);
                        nameInput.classList.add('border-red-500');
                        positionInput.classList.add('border-red-500');
                    } else {
                        nameInput.classList.remove('border-red-500');
                        positionInput.classList.remove('border-red-500');
                    }
                });

                return { isValid, emptyFields };
            };

            const preparedByValidation = validateEntries('preparedBy');
            const notedByValidation = validateEntries('notedBy');
            const approvedByValidation = validateEntries('approvedBy');

            if (!preparedByValidation.isValid || !notedByValidation.isValid || !approvedByValidation.isValid) {
                let errorMessage = 'Please fill in all required fields:\n';

                if (!preparedByValidation.isValid) {
                    errorMessage += `\nPrepared By: Entries ${preparedByValidation.emptyFields.join(', ')}`;
                }
                if (!notedByValidation.isValid) {
                    errorMessage += `\nNoted By: Entries ${notedByValidation.emptyFields.join(', ')}`;
                }
                if (!approvedByValidation.isValid) {
                    errorMessage += `\nApproved By: Entries ${approvedByValidation.emptyFields.join(', ')}`;
                }

                await Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: errorMessage,
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            // Collect form data
            const getEntries = (containerId) => {
                return Array.from(document.getElementById(`${containerId}Container`).children).map(entry => {
                    const nameInput = entry.querySelector(`input[id^="${containerId}Name"]`);
                    const positionInput = entry.querySelector(`input[id^="${containerId}Position"]`);
                    return {
                        name: nameInput.value.trim(),
                        position: positionInput.value.trim()
                    };
                });
            };

            const certificationDetails = {
                preparedBy: getEntries('preparedBy'),
                notedBy: getEntries('notedBy'),
                approvedBy: getEntries('approvedBy')
            };

            // Send update request
            const response = await fetch('/api/certification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ certificationDetails })
            });

            if (!response.ok) {
                throw new Error('Failed to update certification details');
            }

            const result = await response.json();
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Certification details updated successfully!',
                confirmButtonColor: '#3085d6'
            });
            window.location.reload();

        } catch (error) {
            console.error('Error updating certification details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update certification details. Please try again.',
                confirmButtonColor: '#3085d6'
            });
        }
    });
}); 
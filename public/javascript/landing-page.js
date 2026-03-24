import { displayRedirectMessage } from "/javascript/helper/showRedirectMessage.js";
import { isValidText } from "/javascript/formInputValidator/isValidText.js"
import "/javascript/landing-page-login.js";
import "/javascript/socket_io.js";
import { showSwalSuccessToast, showSwalErrorToast, confirmErrorAlert, confirmAlert } from '/javascript/helper/sweetAlertFunctions.js';
import { showLoading, hideLoader } from "/javascript/helper/loader.js"

// const loginModal = document.querySelector('#login-modal');

// const loginButton = document.querySelector('#login-button');
// if (loginButton) {
//     loginButton.addEventListener('click', () => {
//         loginModal.showModal();
//     });
// }

// document.querySelector("#login-modal-exit").addEventListener('click', function (event) {
//     loginModal.close();
// });

// updateUuidStatusOnLoad();
displayRedirectMessage();
// openRegisterDeviceModal();
// closeRegisterDeviceModal();
// submitRegisterDeviceForm();

// function updateUuidStatusOnLoad() {
//     document.addEventListener('DOMContentLoaded', async () => {
//         const uuid = getRegisterDeviceUuidIfExist();

//         if (!uuid) return;

//         const response = await fetch(`/api/uuid/${uuid}`);
//         if (!response.ok) return;

//         const responseObject = await response.json();

//         if (responseObject.status === 'DELETED') {
//             localStorage.removeItem('register-device-data');

//         } else if (responseObject.status === 'PENDING') {
//             displayUUID(responseObject.status);

//         } else {
//             displayUUID(responseObject.status)

//         }

//     })
// }

// function getRegisterDeviceUuidIfExist() {
//     const registerDeviceData = localStorage.getItem('register-device-data');
//     if (!registerDeviceData) return;

//     const data = JSON.parse(registerDeviceData);
//     return data.uuid;
// }

// function openRegisterDeviceModal() {
//     document.querySelector('#register-device-button').addEventListener('click', () => {
//         document.querySelector('#registerDeviceModal').showModal();
//     })
// }

// function closeRegisterDeviceModal() {
//     document.querySelector('#closeRegisterDevice').addEventListener('click', () => {
//         document.querySelector('#registerDeviceModal').close();
//         document.querySelector("#registerDeviceForm").reset();
//     })
// }

// function submitRegisterDeviceForm() {
//     document.querySelector('#registerDeviceForm').addEventListener('submit', async (event) => {
//         event.preventDefault();

//         const codeName = document.querySelector('#code-name');
//         const codeNameErrorMessage = document.querySelector('#codeNameErrorMessage');


//         if (!isValidText([codeName], codeNameErrorMessage)) return;

//         try {

//             const response = await fetchUuid(codeName.value) // send codename to server to get uuid as response
//             const responseObject = await response.json();

//             if (!response.ok) {
//                 const action = await confirmErrorAlert(responseObject.message);
//                 if (action.isConfirmed) {
//                     return document.querySelector('#registerDeviceModal').showModal();
//                 }
//             }

//             setUuidToLocalStorage(responseObject);
//             displayUUID("PENDING");

//             const action = await confirmAlert("Registration send", "Your request is now pending for approval");
//             if (action.isConfirmed) {
//                 document.querySelector('#registerDeviceModal').showModal();
//             }
//         } catch (error) {
//             console.log(error);
//         }
//     });
// }

// async function fetchUuid(codeName) {
//     document.querySelector('#registerDeviceModal').close();
//     showLoading();

//     const response = await fetch('/api/uuid', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ codeName })
//     });

//     hideLoader();

//     return response;
// }

// function setUuidToLocalStorage(registerResponseObject) {
//     if (!registerResponseObject || typeof registerResponseObject !== 'object') return showSwalErrorToast('Cannot set response');

//     const objectToStore = JSON.stringify(registerResponseObject);

//     try {
//         if (!localStorage.getItem('register-device-data')) {
//             return localStorage.setItem('register-device-data', objectToStore);
//         }
//     } catch (error) {
//         console.error('Failed to set data in localStorage:', error);
//         return showSwalErrorToast('Failed to store data');
//     }
// }

// function displayUUID(status) {
//     const storedRegisterDeviceData = localStorage.getItem('register-device-data');
//     const registerDeviceData = JSON.parse(storedRegisterDeviceData);

//     const statusMessage = status === 'PENDING' ? "Registration pending..." : "Device registered";

//     const registerDeviceForm = document.querySelector('#registerDeviceForm');

//     // Set the title depending on status
//     registerDeviceForm.closest('dialog').querySelector('h2').textContent = statusMessage;

//     // Remove the submit button
//     const submitButton = registerDeviceForm.querySelector('input[type="submit"]');
//     if (submitButton) {
//         submitButton.remove();
//     }

//     // Add the uuid indisplay
//     const uuidInnerHtmlToDisplay = `
//     <div class="flex flex-col mt-3">
//         <label for="code-name" class="font-medium text-gray-800">Code name *</label>
//         <input type="text" id="code-name" disabled value="${registerDeviceData.codeName}" class="py-1 pl-3 font-normal border border-gray-400 rounded-md focus:outline-blue-500">
//         <div id="codeNameErrorMessage" class="text-sm font-normal text-red-500 min-h-5"></div>
//       </div>

//     <div class="mb-7">
//         <label for="uuid" class="font-medium text-gray-800">UUID</label>
//         <input id="uuid" type="text" value="${registerDeviceData.uuid}" disabled placeholder="Request UUID" readonly class="w-full py-1 pl-3 mb-6 font-normal border-gray-400 border rounded-md focus:outline-blue-500">
//     </div>
//     `;
//     registerDeviceForm.innerHTML = uuidInnerHtmlToDisplay;
// }

// async function fetchPublicIP() {
//     try {
//         const response = await fetch('https://api.ipify.org?format=json');
//         const data = await response.json();

//         return data.ip;
//     } catch (error) {
//         console.error('Error fetching IP address:', error);
//         return confirmErrorAlert('Error fetching IP address');
//     }
// }

// async function toggleRegisterDeviceButton() {
//     try {
//         // const registerDeviceButton = document.querySelector('#register-device-button');
//         // if (!registerDeviceButton) return;

//         const devicePublicIpAddress = await fetchPublicIP();
//         const response = await fetch(`/api/ip-address?ipAddress=${devicePublicIpAddress}`);
//         const responseObject = await response.json();

//         if (!response.ok) throw new Error(responseObject?.message);

//         if (responseObject?.ip_address && responseObject.ip_address === devicePublicIpAddress) {
//             // registerDeviceButton.classList.remove('hidden');
//             // registerDeviceButton.classList.add('flex');
//         }

//     } catch (error) {
//         console.log(error.message);
//     }
// }

// function handleConnectionStatus() {
//     const ipAddressElement = document.querySelector('#ip-address');
//     const statusIndicator = document.querySelector('#connection-status');

//     ipAddressElement.addEventListener('click', async () => {
//         const ip = ipAddressElement.textContent;
//         if (ip && ip !== 'Not Available' && ip !== 'Offline') {
//             try {
//                 await navigator.clipboard.writeText(ip);
//                 showSwalSuccessToast('IP Address copied to clipboard!');
//             } catch (err) {
//                 showSwalErrorToast('Failed to copy IP Address');
//             }
//         }
//     });

//     function updateOnlineStatus() {
//         if (navigator.onLine) {
//             statusIndicator.classList.remove('bg-red-500');
//             statusIndicator.classList.add('bg-green-500');
//             fetchPublicIP().then(ip => {
//                 if (ip) {
//                     ipAddressElement.textContent = ip;
//                 }
//             });
//         } else {
//             statusIndicator.classList.remove('bg-green-500');
//             statusIndicator.classList.add('bg-red-500');
//             ipAddressElement.textContent = 'Offline';
//         }
//     }

//     updateOnlineStatus();

//     window.addEventListener('online', updateOnlineStatus);
//     window.addEventListener('offline', updateOnlineStatus);
// }

// handleConnectionStatus();
// toggleRegisterDeviceButton();

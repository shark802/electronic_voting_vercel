import "/javascript/voter/election_page_click_vote.js";
import { displayRedirectMessage } from "/javascript/helper/showRedirectMessage.js";
import { showSwalSuccessToast } from "/javascript/helper/sweetAlertFunctions.js";
import "/javascript/logout.js"
import "/javascript/socket_io.js"

document.addEventListener('DOMContentLoaded', async () => {
   try {

      const uuid = getRegisterDeviceUuidIfExist();
      if (!uuid) return;

      const devicePublicIpAddress = await fetchPublicIP();

      const isDeviceRegistered = await checkUuidIfRegistered(uuid);
      if (!isDeviceRegistered) return;

      const isIpAddressExist = await checkIpAddressIfExist(devicePublicIpAddress);
      if (!isIpAddressExist) return;

      document.querySelector('#register-face-button-container').classList.remove('hidden');

   } catch (error) {
      console.error(error);

   }
})

function getRegisterDeviceUuidIfExist() {
   const registerDeviceData = localStorage.getItem('register-device-data');
   if (!registerDeviceData) return;

   const data = JSON.parse(registerDeviceData);
   return data.uuid;
}

async function fetchPublicIP() {
   try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();

      return data.ip;
   } catch (error) {
      console.error('Error fetching IP address:', error);
   }
}

async function checkUuidIfRegistered(uuid) {
   try {

      const response = await fetch(`/api/uuid/${uuid}`);
      if (!response.ok) return;

      const responseObject = await response.json();

      return responseObject.status === 'REGISTERED' ? true : false;

   } catch (error) {
      console.error(error);

   }
}

async function checkIpAddressIfExist(ipAddress) {
   try {

      const response = await fetch(`/api/ip-address?ipAddress=${ipAddress}`);
      const responseObject = await response.json();

      return responseObject?.ip_address && responseObject.ip_address === ipAddress ? true : false;

   } catch (error) {
      console.error(error);
   }
}

document.querySelectorAll("#vote-now-button").forEach(button => {
   const parentSection = button.closest('section');

   let start = new Date(parentSection.querySelector("#date-start").value);
   const [startHour, startMinute] = parentSection.querySelector("#time-start").value.split(":");
   start.setHours(startHour, startMinute);

   let end = new Date(parentSection.querySelector("#date-end").value);
   const [endHour, endMinute] = parentSection.querySelector("#time-end").value.split(":");
   end.setHours(endHour, endMinute);

   // let electionStatusMessage = parentSection.querySelector("#election-status-message");

   displayRedirectMessage();
   displayToast();

   // setInterval(() => {
   //    let present = new Date();

   //    if (start <= present && end >= present) { // means voting is now available
   //       updateElementContent(electionStatusMessage, "The election is now live! Cast your vote to make your voice heard.", "text-blue-700", "bg-blue-100");
   //       updateButtonStyle(button, "Vote Now", "bg-blue-600", "hover:bg-blue-700");
   //    }

   //    if (present > end) { // means voting is finished
   //       updateElementContent(electionStatusMessage, "The election has ended. You can now view the results.", "text-green-700", "bg-green-100");
   //       updateButtonStyle(button, "View Result", "bg-green-600", "hover:bg-green-700");
   //    }

   // }, 1000);

});

function updateElementContent(element, text, textColorClass, bgColorClass) {
   const icon = element.querySelector('svg');
   element.innerHTML = '';
   if (icon) element.appendChild(icon);
   const span = document.createElement('span');
   span.textContent = text;
   element.appendChild(span);
   element.className = `p-4 mb-6 text-sm font-bold text-center ${textColorClass} ${bgColorClass} rounded-lg lg:text-base flex items-center justify-center`;
}

function updateButtonStyle(button, text, bgColorClass, hoverColorClass) {
   const icon = button.querySelector('svg');
   button.innerHTML = '';
   if (icon) button.appendChild(icon);
   const span = document.createElement('span');
   span.textContent = text;
   button.appendChild(span);
   button.className = `w-full py-3 text-sm font-semibold text-white transition-all duration-200 ${bgColorClass} rounded-lg ${hoverColorClass} focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 flex items-center justify-center`;
}

function displayToast() {
   const urlQueryParams = new URLSearchParams(window.location.search);
   const isVoted = urlQueryParams.get("isVoted");
   if (isVoted === 'true') {
      showSwalSuccessToast("Thank you for participating");
   }
}

function toggleProfile() {
   document.querySelector('#profile-info').addEventListener('click', () => {
      $(document.querySelector("#account-section")).slideToggle(300)
   });
}

document.addEventListener('click', (event) => {
   if (!event.target.closest('#profile-container')) return $(document.querySelector("#account-section")).slideUp(300)
})

toggleProfile();


// Register face modal
const registerFaceButton = document.querySelector("#register-face-button");
const registerFaceModalCloseButton = document.querySelector("#close-face-register-modal");

if (registerFaceButton) {
   registerFaceButton.addEventListener("click", () => {
      $(document.querySelector('#account-section')).slideUp(300);
      document.querySelector("#register-face-modal-option").showModal();
   })
}

if (registerFaceModalCloseButton) {
   registerFaceModalCloseButton.addEventListener("click", () => {
      document.querySelector("#register-face-modal-option").close();
   })
}


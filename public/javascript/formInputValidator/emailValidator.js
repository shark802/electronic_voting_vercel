// export function validateEmail(emailInput) {
// 	if (!(emailInput instanceof HTMLElement)) {
// 		console.error(`Invalid argument passed. Expected an HTMLElement.`);
// 		return;
// 	}

import { clearParserCache } from "mysql2";

// 	let isValid = false;

// 	emailInput.addEventListener("change", (event) => {
// 		const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
// 		let emailInputValue = event.target.value.trim();

// 		if (emailInputValue === "") {
// 			alert("Whitespace character is invalid");
// 			event.target.value = "";
// 			isValid = false;
// 		} else if (!emailInputValue.match(emailPattern)) {
// 			alert("Email is invalid");
// 			isValid = false;
// 		} else {
// 			// Clear error message or indicate success
// 			console.log("Email is valid");
// 			isValid = true;
// 		}
// 	});
// 	return isValid;
// }


export function validateEmail(emailValue, ) {
	try {
		const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		let errorMessage = document.querySelector("#emailErrorMessage")
		
		if (emailValue === "") {
			alert("Whitespace character is invalid");
			emailValue = "";
			// TODO Display error in html

			return false;
		} else if (!emailValue.match(emailPattern)) {
			alert("Email is invalid");
			// TODO Dispaly error in html
			return false;
		} else {
			// Clear error message or indicate success
			// TODO clear error message if exist
			console.log("Email is valid");
			isValid = true;
		}
		
	} catch (error) {
		console.error(error);
	}
}
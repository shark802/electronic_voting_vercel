export function isValidText(arrayValue, errorMessageDisplay) {
	try {
		if (!Array.isArray(arrayValue) || arrayValue.length < 1) throw new Error(`${arrayValue} is not a valid array`);

		let textInput = arrayValue[0].value

		if (textInput.trim() === "") {
			arrayValue[0].value = ""
			errorMessageDisplay.textContent = "Whitespace input invalid"
			return false;
		} else {
			errorMessageDisplay.textContent = "";
			return true;
		}

	} catch (error) {
		console.error(error);
	}
}

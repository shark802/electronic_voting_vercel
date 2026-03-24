

export function isInputNotEmpty(arrayValue, errorMessageDisplay) {
    try {
        if (!Array.isArray(arrayValue)) throw new Error(`${arrayValue} is expected to be an array`);
        arrayValue.forEach(element => {
            if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {

            } else throw new Error(`${element} Invalid HTML input element`);
        });

        const inputToCheck = arrayValue[0].value;
        if (inputToCheck.trim() === "") {
            arrayValue[0].value = ""
            errorMessageDisplay.textContent = "Empty input is invalid!"
            return false;
        } else {
            errorMessageDisplay.textContent = "";
            return true;
        }

    } catch (error) {
        console.error(error);
    }
}

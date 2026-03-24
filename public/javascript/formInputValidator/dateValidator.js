/**
 * Validates if the start date is not empty, in the correct format, and not in the past.
 * 
 * @param {Array} arrayValue - An array that contain one HTNL input element to be validate. ex - [ startDate ]
 * @param {*} errorMessageDisplay - The HTML element that display the error message for the input to validate.
 * @returns {boolean} - Return true if start date value is valid, fasle otherwise.
 * @throws - Throw if arrayValue pass is not array or arrayValue element contains invalid HTMLInputElement.
 */
export function isValidStartDate(arrayValue, errorMessageDisplay) {
    try {
        if (!Array.isArray(arrayValue)) throw new Error(`${arrayValue} is expected to be an array`);

        arrayValue.forEach(element => {
            if (!(element instanceof HTMLInputElement)) throw new Error(`${element} Invalid HTML input element`);
        })
        
        const PRESENT_DATE = new Date();
        const inputDate = new Date(arrayValue[0].value);

        // Set time components to zero for comparison
        PRESENT_DATE.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);

        if (arrayValue[0].value.trim() === "") {
            errorMessageDisplay.textContent = "Start date must not be empty";
            return false;
        } else if (isNaN(inputDate.getTime())) {
            errorMessageDisplay.textContent = "Invalid date format";
            return false;
        } else if (inputDate < PRESENT_DATE) {
            errorMessageDisplay.textContent = "Start date must not be in the past";
            return false;
        } else {
            errorMessageDisplay.textContent = "";
            return true;
        }

    } catch (error) {
        console.error(error);
        return false;
    }
}

/**
 * Validates if the end date is not empty, in the correct format, not in the past and not earlier than the start date.
 * 
 * @param {Array} arrayValue - An array that should contain atleast 2 HTML input element to be validate. ex - [ startDate, endDate ]
 * @param {*} errorMessageDisplay - The HTML element that display the error message for the input to validate.
 * @returns {boolean} - Return true if start date value is valid, fasle otherwise.
 * @throws - Throw if arrayValue pass is not array, array length is less than 2 or arrayValue element contains invalid HTMLInputElement.
 */
export function isValidEndDate(arrayValue, errorMessageDisplay) {
    try {
        // The arrayValue must be an array,Throw error if not
        if (!Array.isArray(arrayValue)) throw new Error(`${arrayValue} is expected to be an array`);

        // Must throw error if the arrayValue parameter array contain less than 2 values, function expect array length to be 2
        if(arrayValue.length < 2) throw new Error(`${arrayValue} must contain 2 values`)

        // Throw error if atleast one element in the array is not instance of HTML input element
        arrayValue.forEach(inputElement => {
            if (!(inputElement instanceof HTMLInputElement)) throw new Error("Invalid HTML input element");
        });

        const valueToCheck = arrayValue[0].value;
        const valueToCompare = arrayValue[1].value;
        
        const PRESENT_DATE = new Date();
        const endDateValue = new Date(valueToCheck);
        const startDateValue = new Date(valueToCompare);

        PRESENT_DATE.setHours(0, 0, 0, 0);
        endDateValue.setHours(0, 0, 0, 0);
        startDateValue.setHours(0, 0, 0, 0);

        if (valueToCheck.trim() === "") {
            errorMessageDisplay.textContent = "End date must not be empty";
            return false;
        } else if (endDateValue < PRESENT_DATE) {
            errorMessageDisplay.textContent = "End date must not be in the past";
            return false;
        } else if (endDateValue < startDateValue) {
            errorMessageDisplay.textContent = "End date must not past of start date";
            return false;
        } else {
            errorMessageDisplay.textContent = "";
            return true;
        } 

    } catch (error) {
        console.error(error);
    }
}
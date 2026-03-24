/**
 * Adds a change event listener to the specified input element.
 *
 * @param {Array} arrayValue - An array that each element must contain instance of HTMLInput element.
 * @param {Function} inputValidator - The validation function to be called on input change.
 * @param {HTMLElement} errorMessage - The HTML element to display the error message.
 */
export function changeEventListener(inputValidator, arrayValue, errorMessage) {
    try {
        if (!Array.isArray(arrayValue)) throw new Error(`${arrayValue} is expected to be an array`);
        arrayValue.forEach(inputElement => {
            if ((inputElement instanceof HTMLInputElement) || (inputElement instanceof HTMLSelectElement)) {

            } else throw new Error("Invalid HTML input element");
        })

        arrayValue[0].addEventListener("change", (event) => {
            inputValidator(arrayValue, errorMessage)
        })
    } catch (error) {
        console.error(error);
    }
}
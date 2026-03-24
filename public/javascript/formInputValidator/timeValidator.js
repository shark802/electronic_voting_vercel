export function isValidStartTime(arrayValue, errorMessagDisplay) {
    try {
        if(!Array.isArray(arrayValue) || arrayValue.length < 1) throw new Error(`${arrayValue} is not a valid array`);

        const timeStart = arrayValue[0].value;

        if(timeStart.trim() === "") {
            errorMessagDisplay.textContent = "Field must not empty!";
            return false;
        } else {
            errorMessagDisplay.textContent = "";
            return true;
        }
        
    } catch (error) {
        console.error(error);
    }
}

export function isValidEndTime(arrayValue, errorMessagDispaly) {
    try {
        if(!Array.isArray(arrayValue) || arrayValue.length < 1) throw new Error(`${arrayValue} is not a valid array or array is empty`);

        const inputEndTime = arrayValue[0].value;
        const inputStartTime = arrayValue[1].value;
        const inputStartDate = arrayValue[2].value;
        const inputEndDate = arrayValue[3].value;

        let startDate = new Date(inputStartDate);
        let endDate = new Date(inputEndDate);

        const [startHour, startMinute] = inputStartTime.split(":");
        const [endHour, endMinute] = inputEndTime.split(":");

        startDate.setHours(startHour, startMinute);
        endDate.setHours(endHour, endMinute);
        if (inputEndTime.trim() === "") {
            errorMessagDispaly.textContent = "Field must not empty!";
            return false;
        } else if (endDate < startDate) {
            errorMessagDispaly.textContent = "Invalid end time";
            return false;
        } else {
            errorMessagDispaly.textContent = "";
            return true;
        }

    } catch (error) {
        console.error(error);
    }
}
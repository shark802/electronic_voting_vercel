const registerDeviceData = localStorage.getItem('register-device-data');

const data = JSON.parse(registerDeviceData);
const uuid = data?.uuid;

const socket = io({ query: { uuid } });

export default socket;

export async function confirmAlert(title, text, options = {}) {

    const { icon = null } = options

    const action = Swal.fire({
        title: title,
        text: text,
        showCancelButton: true,
        confirmButtonColor: "#2060f7",
        reverseButtons: true,
        icon: icon
    });

    return action;
}

export async function confirmErrorAlert(title, text) {
    const action = Swal.fire({
        title: title,
        text: text,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: "#2060f7",
        reverseButtons: true,
    });

    return action;
}

export function showSwalSuccessToast(title, text) {
    Swal.fire({
        toast: true,
        showConfirmButton: false,
        position: 'top',
        timer: 3000,
        timerProgressBar: true,
        title: title,
        text: text,
        icon: 'success'
    });
}

export function showSwalWarningToast(title, text) {
    Swal.fire({
        toast: true,
        showConfirmButton: false,
        position: 'top',
        timer: 3000,
        timerProgressBar: true,
        title: title,
        text: text,
        icon: 'warning'
    });
}

export function showSwalErrorToast(title, text) {
    Swal.fire({
        toast: true,
        showConfirmButton: false,
        position: 'top',
        timer: 3000,
        timerProgressBar: true,
        title: title,
        text: text,
        icon: 'error'
    });
}

export function showRedirectMessage(text) {
    Swal.fire({
        title: text,
        confirmButtonColor: "#2060f7",
        reverseButtons: true,
    });
}
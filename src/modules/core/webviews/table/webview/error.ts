const errorMessageElement = document.getElementById("error-message");
const errorMessageContainerElement = document.getElementById("error-message-container");
const errorCloseElement = document.getElementById("error-close");

export function showErrorMessage(message: string) {
    if (errorMessageElement && errorMessageContainerElement) {
        errorMessageElement.innerText = message;
        errorMessageContainerElement.classList.remove('d-none');
    }
}

export function removeErrorMessage() {
    if (errorMessageElement && errorMessageContainerElement) {
        errorMessageContainerElement.classList.add('d-none');
    }
}

errorCloseElement?.addEventListener('click', removeErrorMessage);

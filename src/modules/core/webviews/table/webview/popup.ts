const popupElementClose = document.getElementById('popup-close')
const popupElement = document.getElementById('popup')
const popupElementContent = document.getElementById('popup-content')
popupElementClose?.addEventListener('click', closePopup)

export function openPopup(content: string) {
    if (popupElementContent && content) {
        popupElementContent.innerHTML = content
        popupElement?.classList.remove('d-none')
        document.body.style.overflow = 'hidden'
    }
}

export function closePopup() {
    popupElement?.classList.add('d-none')
    document.body.style.overflow = 'unset'
}

const popupElementClose = document.getElementById('popup-close');
const popupElement = document.getElementById('popup');
const popupElementContent = document.getElementById('popup-content');
popupElementClose?.addEventListener('click', (e) => {
    popupElement?.classList.add('d-none');
    document.body.style.overflow = 'unset';
});

export function openPopup(content: string) {
    if (popupElementContent && content) {
        popupElementContent.innerHTML = content;
        popupElement?.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
    };
}

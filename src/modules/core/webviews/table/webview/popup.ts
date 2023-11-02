const popupElementClose = document.getElementById('popup-close');
const popupElement = document.getElementById('popup');
popupElementClose?.addEventListener('click', (e) => {
    popupElement?.classList.add('d-none');
    document.body.style.overflow = 'unset';
});

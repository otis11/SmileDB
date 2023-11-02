export function renderSelectWithId(id: string, items: string[], onChangeCallback: (el: HTMLElement) => void) {
    const selectElement = document.getElementById(id);
    if (selectElement) {
        selectElement.innerHTML = `<div class="select-value"></div>
    <div class="select-icon"><i class="codicon codicon-chevron-down"></i></div>
    <div class="select-options"></div>`;
    }
    selectElement?.addEventListener('click', () => {
        selectElement.classList.toggle('select--active');
    });

    selectElement?.addEventListener('blur', () => {
        selectElement.classList.remove('select--active');
    });

    const options = selectElement?.querySelector('.select-options');
    options?.addEventListener('click', (e) => {
        if (e.target instanceof HTMLElement) {
            const valueElement = selectElement?.querySelector('.select-value');
            if (valueElement) {
                valueElement.innerHTML = e.target.outerHTML;
            }
            onChangeCallback(e.target);
        }
    });

    for (let i = 0; i < items.length; i++) {
        options?.insertAdjacentHTML('beforeend', items[i]);
    }

    const valueElement = selectElement?.querySelector('.select-value');
    if (valueElement instanceof HTMLElement) {
        valueElement.innerHTML = items[0];
        if (valueElement.children[0]) {
            onChangeCallback(valueElement.children[0] as HTMLElement);
        }
    }
}

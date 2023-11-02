export function createCodiconElement(icon: string, small?: boolean) {
    const iconContainer = document.createElement("div");
    if (small) {
        iconContainer.classList.add("icon-small");
    }
    const iconElement = document.createElement("i");
    iconElement.classList.add("codicon", "codicon-" + icon);
    iconContainer.appendChild(iconElement);
    return iconContainer;
}

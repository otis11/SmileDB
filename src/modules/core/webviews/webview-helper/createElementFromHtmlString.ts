export function createElementFromHTMLString(htmlString: string) {
    const div = document.createElement('div')
    div.innerHTML = htmlString.trim()
    return div.firstElementChild as HTMLElement
}

const loadingElement = document.getElementById("loading")

export function setLoading(loading: boolean) {
    if (loading) {
        loadingElement?.classList.remove('d-none')
    } else {
        loadingElement?.classList.add('d-none')
    }
}

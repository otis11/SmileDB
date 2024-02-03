export function htmlSanitizeValue(value?: string) {
    if (typeof value !== 'string') return value
    return value?.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

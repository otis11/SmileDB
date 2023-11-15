export function htmlSanitizeValue(value?: string) {
    return value?.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
}

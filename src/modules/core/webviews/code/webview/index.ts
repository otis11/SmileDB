import { provideVSCodeDesignSystem, vsCodeDivider } from "@vscode/webview-ui-toolkit"
// Using ES6 import syntax
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
)
hljs.registerLanguage('sql', sql)

const codeEl = document.querySelector('code') as HTMLElement
hljs.highlightElement(codeEl)

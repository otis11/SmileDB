import { provideVSCodeDesignSystem, vsCodeDivider, vsCodeLink } from "@vscode/webview-ui-toolkit";
import { vscode } from "../../webview-helper/vscode";

provideVSCodeDesignSystem().register(
    vsCodeDivider(),
    vsCodeLink()
);

document.getElementById('go-to-settings')?.addEventListener('click', () => {
    vscode.postMessage({
        command: 'workbench.action.openSettings',
        payload: 'SmileDB'
    });
});

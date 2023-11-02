### Local Development
1. Clone Project
```bash
git clone https://github.com/eat4/SmileDB.git
```
2. Install dependencies
```bash
npm i
```
3. Run esbuild watch. Builds everytime something changes
```bash
npm run esbuild-watch
```
4. Press f5 to run project

to build the webview again.

5. Start all database services
```bash
docker compose up -d
```

### Codicons in a webview
- codicons in webview https://github.com/microsoft/vscode-extension-samples/blob/main/webview-codicons-sample/src/extension.ts
https://microsoft.github.io/vscode-codicons/dist/codicon.html
- codicons webview needs to be in rootsAllowed https://github.com/microsoft/vscode-extension-samples/issues/720

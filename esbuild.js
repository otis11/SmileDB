const { copy } = require('esbuild-plugin-copy');
const { build } = require('esbuild');
const fs = require('fs');

const args = process.argv;
const FLAGS = {
    watch: '--watch',
    sourcemap: '--sourcemap',
    minify: '--minify',
};

(async () => {
    // build webviews
    // example: dist/webviews/help/webview/style.css
    const webviewFiles = getFilePathsRecursive('./src/modules/core/webviews', '/webview/');
    // add global css
    webviewFiles.push('./src/modules/core/webviews/global.css')
    for (let i = 0; i < webviewFiles.length; i++) {
        await build({
            entryPoints: [
                webviewFiles[i],
            ],
            minify: args.includes(FLAGS.minify),
            outdir: './dist/' + webviewFiles[i].slice(webviewFiles[i].indexOf('webview'), webviewFiles[i].lastIndexOf('/')),
            bundle: true,
            logLevel: 'info',
            watch: args.includes(FLAGS.watch),
        });
    }

    // build extension backend
    const res = await build({
        entryPoints: [
            './src/extension.ts',
        ],
        bundle: true,
        // as resolveFrom not set, we use dist as output base dir
        outdir: './dist',
        platform: 'node',
        format: 'cjs',
        minify: args.includes(FLAGS.minify),
        sourcemap: args.includes(FLAGS.sourcemap),
        external: [
            'vscode',
        ],
        watch: args.includes(FLAGS.watch),
        logLevel: 'info',
        plugins: [
            copy({
                assets: [
                    {
                        from: [
                            './node_modules/@vscode/codicons/dist/*',
                        ],
                        to: [
                            './codicons',
                        ],
                    },
                ],
            }),
        ],
    });
})();

function getFilePathsRecursive(root, filePathIncludes) {
    let filesFiltered = [];
    const files = fs.readdirSync(root);
    for (let i = 0; i < files.length; i++) {
        const filePath = `${root}/${files[i]}`;
        const stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            filesFiltered = [
                ...getFilePathsRecursive(filePath, filePathIncludes),
                ...filesFiltered
            ];
        }
        else if (stat.isFile() && filePath.includes(filePathIncludes)) {
            filesFiltered.push(filePath);
        }
    }
    return filesFiltered;
}

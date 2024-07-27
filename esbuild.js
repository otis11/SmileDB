const { copy } = require('esbuild-plugin-copy');
const { build } = require('esbuild');
const fs = require('fs');

const args = process.argv;
const FLAGS = {
    watch: '--watch',
    sourcemap: '--sourcemap',
    minify: '--minify',
};

fs.rmSync('./dist', { recursive: true, force: true });
fs.mkdirSync('./esbuild-meta', { recursive: true });

(async () => {
    // build webviews
    const webviewsResult = await build({
        entryPoints: [
            './src/modules/webviews/webview-global.css',
            './src/modules/webviews/table/index.ts',
            './src/modules/webviews/edit-connection/index.ts',
            './src/modules/webviews/code/index.ts',
            './src/modules/webviews/help/index.ts',
            './src/modules/webviews/active-connections/index.ts',
        ],
        minify: args.includes(FLAGS.minify),
        outdir: './dist/webviews',
        metafile: true,
        bundle: true,
        logLevel: 'info',
        watch: args.includes(FLAGS.watch),
    });

    // build extension backend
    const extensionResult = await build({
        entryPoints: [
            './src/extension.ts',
        ],
        bundle: true,
        // as resolveFrom not set, we use dist as output base dir
        outdir: './dist',
        platform: 'node',
        format: 'cjs',
        metafile: true,
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

    // go to https://esbuild.github.io/analyze/
    fs.writeFileSync('./esbuild-meta/webviews.json', JSON.stringify(webviewsResult.metafile))
    fs.writeFileSync('./esbuild-meta/extension.json', JSON.stringify(extensionResult.metafile))
})();

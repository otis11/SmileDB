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

(async () => {
    // build webviews
    await build({
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
        bundle: true,
        logLevel: 'info',
        watch: args.includes(FLAGS.watch),
    });

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

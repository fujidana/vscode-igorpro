const esbuild = require("esbuild");

/* modules for web extensions */
const glob = require('glob');
const path = require('path');
const { polyfillNode } = require('esbuild-plugin-polyfill-node');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * For web extension, all tests, including the test runner, need to be bundled into
 * a single module that has a exported `run` function .
 * This plugin bundles implements a virtual file extensionTests.ts that bundles all these together.
 * @type {import('esbuild').Plugin}
 */
const testBundlePlugin = {
	name: 'testBundlePlugin',
	setup(build) {
		build.onResolve({ filter: /[\/\\]extensionTests\.ts$/ }, args => {
			if (args.kind === 'entry-point') {
				return { path: path.resolve(args.path) };
			}
		});
		build.onLoad({ filter: /[\/\\]extensionTests\.ts$/ }, async args => {
			const testsRoot = path.join(__dirname, 'src/test');
			// const testsRoot = path.join(__dirname, 'src/web/test/suite');
			const files = await glob.glob('*.test.{ts,tsx}', { cwd: testsRoot, posix: true });
			return {
				contents:
					`export { run } from './mochaTestRunner.ts';` +
					files.map(f => `import('./${f}');`).join(''),
				watchDirs: files.map(f => path.dirname(path.resolve(testsRoot, f))),
				watchFiles: files.map(f => path.resolve(testsRoot, f))
			};
		});
	}
};

async function main() {
	const nodeCtx = await esbuild.context({
		entryPoints: [
			'src/extension.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/node/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		plugins: [
			/* add to the end of plugins array */
			esbuildProblemMatcherPlugin,
		],
	});

	const webCtx = await esbuild.context({
		entryPoints: [
			'src/extension.ts',
			'src/test/extensionTests.ts'
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outdir: 'dist/web',
		external: ['vscode'],
		logLevel: 'silent',
		// Node.js global to browser globalThis
		define: {
			global: 'globalThis',
		},

		plugins: [
			polyfillNode({
				globals: {
					process: true,
					buffer: true,
				},
				polyfills: {
					fs: true,
				}
			}),
			testBundlePlugin,
			esbuildProblemMatcherPlugin, /* add to the end of plugins array */
		],
	});

	if (watch) {
		await nodeCtx.watch();
		await webCtx.watch();
		// await Promise.all([nodeCtx.watch(), webCtx.watch()]);
	} else {
		await nodeCtx.rebuild();
		await nodeCtx.dispose();
		await webCtx.rebuild();
		await webCtx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});

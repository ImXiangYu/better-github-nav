import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { build, context } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ENTRY_FILE = path.join(ROOT_DIR, 'src', 'main.js');
const HEADER_TEMPLATE_FILE = path.join(ROOT_DIR, 'scripts', 'userscript-header.txt');
const PACKAGE_FILE = path.join(ROOT_DIR, 'package.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'better-github-nav.user.js');

async function loadPackageVersion() {
    const raw = await readFile(PACKAGE_FILE, 'utf8');
    const pkg = JSON.parse(raw);
    if (!pkg.version || typeof pkg.version !== 'string') {
        throw new Error('Invalid package.json version');
    }
    return pkg.version;
}

async function loadUserscriptHeader(version) {
    const template = await readFile(HEADER_TEMPLATE_FILE, 'utf8');
    return template.replace(/__VERSION__/g, version).trimEnd();
}

function createBuildOptions(version, userscriptHeader) {
    return {
        entryPoints: [ENTRY_FILE],
        bundle: true,
        format: 'iife',
        platform: 'browser',
        target: ['es2020'],
        outfile: OUTPUT_FILE,
        charset: 'utf8',
        legalComments: 'none',
        minify: false,
        define: {
            __SCRIPT_VERSION__: JSON.stringify(version)
        },
        banner: {
            js: `${userscriptHeader}\n`
        }
    };
}

async function run() {
    const isWatch = process.argv.includes('--watch');
    const version = await loadPackageVersion();
    const userscriptHeader = await loadUserscriptHeader(version);
    const options = createBuildOptions(version, userscriptHeader);

    if (isWatch) {
        const ctx = await context(options);
        await ctx.watch();
        console.log(`[build] watching ${path.relative(ROOT_DIR, ENTRY_FILE)} -> ${path.relative(ROOT_DIR, OUTPUT_FILE)} (v${version})`);
        return;
    }

    await build(options);
    console.log(`[build] generated ${path.relative(ROOT_DIR, OUTPUT_FILE)} (v${version})`);
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

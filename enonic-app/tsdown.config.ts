import {globSync} from 'glob';
import {defineConfig} from 'tsdown';


const SRC = 'src/main/resources';
const SRC_ASSETS = `${SRC}/assets`;
const DST = 'build/resources/main';
const DST_ASSETS = `${DST}/assets`;

const dev = process.env.NODE_ENV === 'development';
const logLevel: 'silent' | 'info' = ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE || '') ? 'silent' : 'info';

function entries(dir: string, exts: string, ignore: string[] = []): Record<string, string> {
  return Object.fromEntries(
    globSync(`${dir}/**/*.${exts}`, {posix: true, ignore})
      .map(file => [file.slice(dir.length + 1).replace(/\.[^.]+$/, ''), file]),
  );
}

const serverEntry = entries(SRC, '{ts,js}', [`${SRC_ASSETS}/**`]);
const assetEntry = entries(SRC_ASSETS, '{tsx,ts,jsx,js}');

const xpExternal = [
  '/lib/enonic/asset',
  '/lib/thymeleaf',
  '/lib/http-client',
  /^\/lib\/xp\//,
];

export default defineConfig([
  ...(Object.keys(serverEntry).length ? [{
    entry: serverEntry,
    outDir: DST,
    format: 'cjs' as const,
    target: 'es2015',
    platform: 'neutral' as const,
    clean: false,
    dts: false,
    minify: false,
    sourcemap: false,
    logLevel,
    tsconfig: `${SRC}/tsconfig.json`,
    inputOptions: {
      external: xpExternal,
      resolve: {
        mainFields: ['module', 'main'],
      },
    },
    outputOptions: {
      chunkFileNames: '_chunks/[name]-[hash].js',
    },
  }] : []),
  ...(Object.keys(assetEntry).length ? [{
    entry: assetEntry,
    outDir: DST_ASSETS,
    format: 'esm' as const,
    target: 'es2015',
    platform: 'browser' as const,
    clean: false,
    dts: false,
    minify: !dev,
    sourcemap: !dev,
    logLevel,
    tsconfig: `${SRC_ASSETS}/tsconfig.json`,
  }] : []),
]);

import {globSync} from 'glob';
import {defineConfig} from 'tsdown';

const SRC = 'src/main/resources';
const DST = 'build/resources/main';

const dev = process.env.NODE_ENV === 'development';
const logLevel: 'silent' | 'info' = ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE || '') ? 'silent' : 'info';

function entries(dir: string, exts: string, ignore: string[] = []): Record<string, string> {
  return Object.fromEntries(
    globSync(`${dir}/**/*.${exts}`, {posix: true, ignore})
      .map(file => [file.slice(dir.length + 1).replace(/\.[^.]+$/, ''), file]),
  );
}

const serverEntry = entries(SRC, '{ts,js}');

const xpExternal = [
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
]);

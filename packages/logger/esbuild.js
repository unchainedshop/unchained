import { build } from 'esbuild';
import fg from 'fast-glob';

export const buildNode = async ({ ...args }) => {
  await build({
    entryPoints: await fg('src/**/*.ts'),
    platform: 'node',
    target: 'node16',
    format: 'esm',
    outdir: './lib',
    watch: Boolean(process.env.ESBUILD_WATCH),
    sourcemap: false,
    logLevel: 'info',
    ...args,
  });
};

await buildNode({});

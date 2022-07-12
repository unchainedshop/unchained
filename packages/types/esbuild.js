import { build } from 'esbuild';
import fg from 'fast-glob';

export const buildNode = async ({ ...args }) => {
  await build({
    entryPoints: await fg('*.ts'),
    platform: 'node',
    target: 'node16',
    format: 'esm',
    outdir: './lib',
    watch: Boolean(process.env.ESBUILD_WATCH),
    sourcemap: true,
    logLevel: 'info',
    ...args,
  });
};

await buildNode({});

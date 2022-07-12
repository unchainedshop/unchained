import { build } from 'esbuild';
import { execSync } from 'child_process';
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
    plugins: [
      {
        name: 'TypeScriptDeclarationsPlugin',
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) return;
            execSync('tsc');
          });
        },
      },
    ],
    ...args,
  });
};

await buildNode({});

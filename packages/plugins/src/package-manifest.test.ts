import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFile, readdir, stat } from 'node:fs/promises';

const packageRoot = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'));

// Published targets live in lib/ and are compiled 1:1 from src/*.ts.
const toSource = (target: string) =>
  target
    .replace(/^\.\//, '')
    .replace(/^lib\//, 'src/')
    .replace(/\.d\.ts$/, '.ts')
    .replace(/\.js$/, '.ts');

const exists = async (relativePath: string) => {
  try {
    await stat(new URL(relativePath, packageRoot));
    return true;
  } catch {
    return false;
  }
};

describe('@unchainedshop/plugins package.json', () => {
  it('main and types point at sources that exist', async () => {
    for (const field of ['main', 'types']) {
      if (!manifest[field]) continue;
      assert.ok(
        await exists(toSource(manifest[field])),
        `"${field}": "${manifest[field]}" has no source file`,
      );
    }
  });

  it('every exports pattern resolves to at least one source', async () => {
    for (const [subpath, target] of Object.entries<string>(manifest.exports)) {
      const [directory, suffix] = toSource(target).split('*');
      const entries = await readdir(new URL(directory, packageRoot));
      let matches = 0;
      for (const entry of entries) {
        if (await exists(`${directory}${entry.replace(/\.ts$/, '')}${suffix}`)) matches += 1;
      }
      assert.ok(matches > 0, `"${subpath}": "${target}" matches no source`);
    }
  });
});

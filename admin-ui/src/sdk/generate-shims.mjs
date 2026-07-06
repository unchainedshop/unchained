#!/usr/bin/env node
/**
 * Writes minimal stub files for each shim entry so tsup can resolve them.
 * The actual shim content (with dynamically discovered exports) is generated
 * at build time by the esbuild plugin in tsup.config.ts — these stubs are
 * never used as-is.
 *
 * Usage: node src/sdk/generate-shims.mjs
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_DEP_SHIMS } from './plugin-runtime.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const shimsDir = join(__dirname, 'shims');

let created = 0;
for (const [specifier, distFile] of Object.entries(SHARED_DEP_SHIMS)) {
  const tsFile = distFile.replace('shims/', '').replace('.js', '.ts');
  const filePath = join(shimsDir, tsFile);
  if (!existsSync(filePath)) {
    writeFileSync(
      filePath,
      `// Stub — real content generated at build time by tsup.config.ts\nimport { hostDep } from './host';\nexport default hostDep(${JSON.stringify(specifier)});\n`,
    );
    created++;
  }
}

if (created > 0) {
  console.log(`Created ${created} shim stub(s)`);
}

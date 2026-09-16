import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'node:test';

const cli = fileURLToPath(new URL('../bin/unchained.js', import.meta.url));

it('prints usage and rejects unknown commands without downloading docs', () => {
  assert.match(execFileSync(process.execPath, [cli], { encoding: 'utf8' }), /download-llm-docs/);
  assert.equal(spawnSync(process.execPath, [cli, 'unknown']).status, 1);
});

it('downloads docs and updates existing agent indexes idempotently', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'unchained-cli-test-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const bin = join(cwd, 'bin');
  mkdirSync(bin);
  // Stand in for git so the CLI exercises its filesystem flow without a network dependency.
  writeFileSync(
    join(bin, 'git'),
    `#!/bin/sh
case "$1" in
  ls-remote) exit 0 ;;
  clone)
    for target; do :; done
    mkdir -p "$target/docs/docs/guides"
    printf '# Setup\\n' > "$target/docs/docs/guides/setup.md"
    ;;
esac
`,
    { mode: 0o755 },
  );
  writeFileSync(join(cwd, 'CLAUDE.md'), '# Local instructions\n');
  writeFileSync(join(cwd, 'AGENTS.md'), '# Agent instructions\n');
  const run = () =>
    execFileSync(process.execPath, [cli, 'download-llm-docs'], {
      cwd,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` },
    });
  run();
  const first = readFileSync(join(cwd, 'AGENTS.md'), 'utf8');
  assert.match(first, /^# Agent instructions\n/);
  assert.match(first, /guides:\{setup.md\}/);
  assert.match(first, /npx --package @unchainedshop\/platform unchained download-llm-docs/);
  assert.match(readFileSync(join(cwd, 'CLAUDE.md'), 'utf8'), /^# Local instructions\n/);
  assert.equal(readFileSync(join(cwd, '.unchained-docs/guides/setup.md'), 'utf8'), '# Setup\n');
  run();
  assert.equal(readFileSync(join(cwd, 'AGENTS.md'), 'utf8'), first);
});

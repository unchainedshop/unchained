#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const GITHUB_REPO = 'https://github.com/unchainedshop/unchained.git';
const DOCS_SUBPATH = 'docs/docs';
const DOCS_DIR = join(process.cwd(), '.unchained-docs');
const INDEX_START = '<!-- UNCHAINED_DOCS_INDEX:BEGIN -->';
const INDEX_END = '<!-- UNCHAINED_DOCS_INDEX:END -->';

const command = process.argv[2];

if (command !== 'download-llm-docs') {
  console.log(`Usage: unchained <command>

Commands:
  download-llm-docs   Download Unchained Engine docs for LLM coding assistants
                      (Claude Code, Cursor, etc.) and inject a file index into
                      CLAUDE.md and/or agents.md`);
  process.exit(command ? 1 : 0);
}

// Resolve version from own package.json
const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const version = pkg.version;

// Determine git ref: try tag first, fallback to master
function tagExists(tag) {
  try {
    execFileSync('git', ['ls-remote', '--tags', '--exit-code', GITHUB_REPO, `refs/tags/${tag}`], {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

const tag = `v${version}`;
const ref = tagExists(tag) ? tag : 'master';
if (ref === 'master') {
  console.log(`Tag ${tag} not found on remote, falling back to master branch.`);
}

// Clone docs using sparse-checkout into a temp directory
const tempDir = mkdtempSync(join(tmpdir(), 'unchained-docs-'));
console.log(`Cloning docs from ${ref} using sparse-checkout ...`);
try {
  execFileSync(
    'git',
    [
      'clone',
      '--filter=blob:none',
      '--no-checkout',
      '--depth',
      '1',
      '--branch',
      ref,
      GITHUB_REPO,
      tempDir,
    ],
    { stdio: 'inherit' },
  );
  execFileSync('git', ['-C', tempDir, 'sparse-checkout', 'set', DOCS_SUBPATH], {
    stdio: 'inherit',
  });
  execFileSync('git', ['-C', tempDir, 'checkout'], { stdio: 'inherit' });
} catch {
  rmSync(tempDir, { recursive: true, force: true });
  console.error('Failed to clone docs repository.');
  process.exit(1);
}

// Copy docs/docs/ contents to .unchained-docs/
const sourceDir = join(tempDir, DOCS_SUBPATH);
if (!existsSync(sourceDir)) {
  rmSync(tempDir, { recursive: true, force: true });
  console.error(`Docs directory not found at ${DOCS_SUBPATH} in the repository.`);
  process.exit(1);
}

rmSync(DOCS_DIR, { recursive: true, force: true });
cpSync(sourceDir, DOCS_DIR, { recursive: true });
rmSync(tempDir, { recursive: true, force: true });

// Scan for markdown files
const markdownsByDir = Map.groupBy(
  readdirSync(DOCS_DIR, { withFileTypes: true, recursive: true }).filter(
    (e) => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.mdx')),
  ),
  (e) => relative(DOCS_DIR, e.parentPath) || '.',
);

const fileCount = [...markdownsByDir.values()].flat().length;
console.log(`Found ${fileCount} markdown files in .unchained-docs/`);

// Build compact pipe-delimited index
const indexSnippet = [
  INDEX_START,
  [
    `[Unchained Engine v${version} Docs Index]`,
    'root: ./.unchained-docs',
    'Search these docs before answering Unchained questions.',
    'If docs missing, run: npx unchained download-llm-docs',
    ...[...markdownsByDir]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([dir, entries]) =>
          `${dir}:{${entries
            .map((e) => e.name)
            .sort()
            .join(',')}}`,
      ),
  ].join('|'),
  INDEX_END,
].join('');

// Upsert index into target files
function upsertIndex(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const [before, ...afterParts] = content.split(INDEX_START);
  const after =
    afterParts.length > 0
      ? afterParts.join(INDEX_START).split(INDEX_END).slice(1).join(INDEX_END)
      : undefined;

  writeFileSync(
    filePath,
    after !== undefined ? before + indexSnippet + after : `${content.trimEnd()}\n${indexSnippet}\n`,
  );
  console.log(`Updated ${relative(process.cwd(), filePath)} with docs index.`);
}

const claudeMdPath = join(process.cwd(), 'CLAUDE.md');
const agentsMdPath = join(process.cwd(), 'agents.md');
const claudeExists = existsSync(claudeMdPath);
const agentsExists = existsSync(agentsMdPath);

if (claudeExists) upsertIndex(claudeMdPath);
if (agentsExists) upsertIndex(agentsMdPath);

if (!claudeExists && !agentsExists) {
  writeFileSync(claudeMdPath, `${indexSnippet}\n`);
  console.log('Created CLAUDE.md with docs index.');
}

// Remind about .gitignore
console.log('\nDone! Remember to add .unchained-docs to your .gitignore.');

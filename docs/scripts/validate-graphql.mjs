import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildClientSchema, buildSchema, extendSchema, getIntrospectionQuery,
  Kind, NoUnusedFragmentsRule, parse, specifiedRules, validate,
} from 'graphql';
import scalars from '../../packages/api/src/schema/scalars.ts';
import directives from '../../packages/api/src/schema/directives.ts';
import types from '../../packages/api/src/schema/types/index.ts';
import inputTypes from '../../packages/api/src/schema/inputTypes.ts';
import query from '../../packages/api/src/schema/query.ts';
import mutation from '../../packages/api/src/schema/mutation.ts';

const docsDirectory = fileURLToPath(new URL('../docs/', import.meta.url));
const isExecutable = ({ kind }) => [Kind.OPERATION_DEFINITION, Kind.FRAGMENT_DEFINITION].includes(kind);

export function buildSourceSchema() {
  const rolesSource = fs.readFileSync(new URL('../../packages/api/src/roles/index.ts', import.meta.url), 'utf8');
  const actionList = rolesSource.match(/const actions[^=]*=\s*\[([\s\S]*?)\]\.reduce/)?.[1];
  if (!actionList) throw new Error('Could not locate the API role action list');
  const actions = [...actionList.matchAll(/^\s*['"]([A-Za-z][A-Za-z_0-9]*)['"],?$/gm)].map(([, action]) => action);
  if (!actions.length) throw new Error('No API role actions found');
  const workerDirectory = new URL('../../packages/plugins/src/worker/', import.meta.url);
  const workTypes = new Set();
  for (const entry of fs.readdirSync(workerDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const source = fs.readFileSync(new URL(`${entry.name}/adapter.ts`, workerDirectory), 'utf8');
    // Read the actual declared adapter types without importing payment/worker dependencies.
    const matches = [...source.matchAll(/^  type: ['"]([A-Z][A-Z_0-9]*)['"],?$/gm)];
    if (!matches.length) throw new Error(`No literal worker type found in ${entry.name}/adapter.ts`);
    for (const [, type] of matches) workTypes.add(type);
  }
  return buildSchema([
    ...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation,
    `extend enum RoleAction { ${actions.join(' ')} }`,
    `extend enum WorkType { ${[...workTypes].join(' ')} }`,
  ].join('\n'));
}

export function extractGraphQLBlocks(content) {
  return [...content.matchAll(/^[ \t]*```(?:graphql|gql)([^\r\n]*)\r?\n([\s\S]*?)^[ \t]*```[ \t]*$/gm)]
    .map((match) => ({
      code: match[2],
      metadata: match[1].trim(),
      line: content.slice(0, match.index).split('\n').length,
    }));
}

export function validateExample(block, schema, pageContent = '') {
  const document = parse(block.code);
  // SDL excerpts describe types, not executable requests. Always check their syntax.
  if (document.definitions.every((definition) => !isExecutable(definition))) return [];
  const schemaMode = block.metadata.match(/\bschema=(\S+)/)?.[1];
  if (schemaMode && schemaMode !== 'page') throw new Error(`Unknown schema mode: ${schemaMode}`);
  if (schemaMode === 'page') {
    // Custom requests must validate against the SDL actually shown on the same page.
    const extensions = [...pageContent.matchAll(/\/\*\s*GraphQL\s*\*\/\s*`([\s\S]*?)`/g)]
      .map(([, source]) => parse(source))
      .filter(({ definitions }) => definitions.every((definition) => !isExecutable(definition)));
    if (!extensions.length) throw new Error('schema=page requires a /* GraphQL */ SDL template on this page');
    for (const extension of extensions) schema = extendSchema(schema, extension);
  }
  const fragmentOnly = document.definitions.every(({ kind }) => kind === Kind.FRAGMENT_DEFINITION);
  const rules = fragmentOnly ? specifiedRules.filter((rule) => rule !== NoUnusedFragmentsRule) : specifiedRules;
  return validate(schema, document, rules);
}

async function main() {
  let schema = buildSourceSchema();
  if (process.env.GRAPHQL_ENDPOINT) {
    const response = await fetch(process.env.GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: getIntrospectionQuery() }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Schema request failed: ${response.status}`);
    const result = await response.json();
    if (result.errors) throw new Error(JSON.stringify(result.errors));
    schema = buildClientSchema(result.data);
  }
  let checked = 0;
  let failures = 0;
  for (const file of fs.readdirSync(docsDirectory, { recursive: true }).filter((file) => /\.mdx?$/.test(file))) {
    const content = fs.readFileSync(path.join(docsDirectory, file), 'utf8');
    for (const block of extractGraphQLBlocks(content)) {
      checked++;
      try {
        const errors = validateExample(block, schema, content);
        for (const error of errors) console.error(`${file}:${block.line}: ${error.message}`);
        if (errors.length) failures++;
      } catch (error) {
        console.error(`${file}:${block.line}: ${error.message}`);
        failures++;
      }
    }
  }
  console.log(`Checked ${checked} GraphQL examples; ${failures} failed.`);
  if (failures || !checked) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

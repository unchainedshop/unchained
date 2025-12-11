import fs from 'fs';
import path from 'path';
import { buildClientSchema, parse, validate } from 'graphql';

// Load the introspection schema
const schemaJson = JSON.parse(fs.readFileSync('/tmp/unchained-schema.json', 'utf8'));
const schema = buildClientSchema(schemaJson.data);

// Find all markdown files
function findMarkdownFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (item.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Extract GraphQL code blocks from markdown
function extractGraphQLBlocks(content, filePath) {
  const blocks = [];
  // Match ```graphql blocks
  const graphqlRegex = /```graphql\n([\s\S]*?)```/g;
  let match;
  while ((match = graphqlRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    blocks.push({
      code: match[1].trim(),
      lineNumber,
      filePath,
      type: 'graphql'
    });
  }

  // Also match ```gql blocks
  const gqlRegex = /```gql\n([\s\S]*?)```/g;
  while ((match = gqlRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    blocks.push({
      code: match[1].trim(),
      lineNumber,
      filePath,
      type: 'gql'
    });
  }

  return blocks;
}

// Validate a GraphQL document
function validateGraphQL(code, schema) {
  try {
    const document = parse(code);
    const errors = validate(schema, document);
    return { parsed: true, errors };
  } catch (parseError) {
    return { parsed: false, parseError: parseError.message };
  }
}

// Main
const docsDir = '/Users/pozylon/Repositories/unchained/docs/docs';
const mdFiles = findMarkdownFiles(docsDir);

console.log(`Found ${mdFiles.length} markdown files\n`);

const allBlocks = [];
const results = {
  valid: [],
  invalid: [],
  parseErrors: []
};

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const blocks = extractGraphQLBlocks(content, file);
  allBlocks.push(...blocks);
}

console.log(`Found ${allBlocks.length} GraphQL code blocks\n`);
console.log('='.repeat(80));
console.log('VALIDATING GRAPHQL SNIPPETS');
console.log('='.repeat(80));

for (const block of allBlocks) {
  const result = validateGraphQL(block.code, schema);
  const relPath = block.filePath.replace('/Users/pozylon/Repositories/unchained/docs/docs/', '');

  if (!result.parsed) {
    results.parseErrors.push({
      ...block,
      error: result.parseError
    });
    console.log(`\n❌ PARSE ERROR in ${relPath}:${block.lineNumber}`);
    console.log(`   Error: ${result.parseError}`);
    console.log(`   Code snippet (first 200 chars):\n   ${block.code.substring(0, 200)}...`);
  } else if (result.errors.length > 0) {
    results.invalid.push({
      ...block,
      errors: result.errors
    });
    console.log(`\n❌ VALIDATION ERROR in ${relPath}:${block.lineNumber}`);
    for (const err of result.errors) {
      console.log(`   - ${err.message}`);
    }
    console.log(`   Code snippet (first 300 chars):\n   ${block.code.substring(0, 300)}...`);
  } else {
    results.valid.push(block);
  }
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Valid: ${results.valid.length}`);
console.log(`❌ Invalid: ${results.invalid.length}`);
console.log(`❌ Parse errors: ${results.parseErrors.length}`);

// Output detailed results
if (results.invalid.length > 0 || results.parseErrors.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('FILES WITH ERRORS:');
  console.log('='.repeat(80));

  const errorFiles = new Map();

  for (const block of [...results.invalid, ...results.parseErrors]) {
    const relPath = block.filePath.replace('/Users/pozylon/Repositories/unchained/docs/docs/', '');
    if (!errorFiles.has(relPath)) {
      errorFiles.set(relPath, []);
    }
    errorFiles.get(relPath).push(block);
  }

  for (const [file, blocks] of errorFiles) {
    console.log(`\n📄 ${file}`);
    for (const block of blocks) {
      console.log(`   Line ${block.lineNumber}: ${block.error || block.errors.map(e => e.message).join('; ')}`);
    }
  }
}

// Write detailed JSON report
fs.writeFileSync('/tmp/graphql-validation-report.json', JSON.stringify({
  summary: {
    total: allBlocks.length,
    valid: results.valid.length,
    invalid: results.invalid.length,
    parseErrors: results.parseErrors.length
  },
  invalid: results.invalid.map(b => ({
    file: b.filePath.replace('/Users/pozylon/Repositories/unchained/docs/docs/', ''),
    line: b.lineNumber,
    errors: b.errors.map(e => e.message),
    code: b.code
  })),
  parseErrors: results.parseErrors.map(b => ({
    file: b.filePath.replace('/Users/pozylon/Repositories/unchained/docs/docs/', ''),
    line: b.lineNumber,
    error: b.error,
    code: b.code
  }))
}, null, 2));

console.log('\n\nDetailed report written to /tmp/graphql-validation-report.json');

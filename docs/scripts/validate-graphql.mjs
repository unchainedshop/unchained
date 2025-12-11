import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildClientSchema, parse, validate, getIntrospectionQuery } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4010/graphql';

// Fetch the introspection schema from the running server
async function fetchSchema() {
  console.log(`Fetching schema from ${GRAPHQL_ENDPOINT}...`);

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery() })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return buildClientSchema(result.data);
}

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
async function main() {
  const schema = await fetchSchema();
  const docsDir = path.resolve(__dirname, '../docs');
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
    const relPath = path.relative(docsDir, block.filePath);

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
      const relPath = path.relative(docsDir, block.filePath);
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

  // Exit with error code if there are validation errors
  if (results.invalid.length > 0 || results.parseErrors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

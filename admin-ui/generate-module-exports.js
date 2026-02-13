#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'src/modules');
const SKIP_MODULES = ['apollo', 'modal', 'Auth', 'UnchainedContext', 'copilot', 'forms', 'common', 'i18n'];
const SKIP_HOOKS = ['useScaffoldVariationProduct', 'useWorkQueue'];

function getFilesInDirectory(dir) {
  try {
    return fs.readdirSync(dir).filter(file => {
      const filePath = path.join(dir, file);
      const hasDoubleExtension = file.match(/\.(ts|tsx)\.(ts|tsx)$/);
      return fs.statSync(filePath).isFile() &&
             (file.endsWith('.ts') || file.endsWith('.tsx')) &&
             file !== 'index.ts' &&
             !hasDoubleExtension;
    });
  } catch (err) {
    return [];
  }
}

function getExportName(filename) {
  return filename.replace(/\.(ts|tsx)$/, '');
}

function hasDefaultExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('export default');
  } catch (err) {
    return false;
  }
}

function hasNamedExport(filePath, exportName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const namedExportRegex = new RegExp(
      `export\\s+(const|function|class|let|var)\\s+${exportName}|export\\s*{[^}]*${exportName}[^}]*}`
    );
    return namedExportRegex.test(content);
  } catch (err) {
    return false;
  }
}

function generateModuleIndex(moduleName, modulePath) {
  const hooksDir = path.join(modulePath, 'hooks');

  const allHooks = getFilesInDirectory(hooksDir);
  const hooks = allHooks.filter(file => {
    const hookName = getExportName(file);
    return !SKIP_HOOKS.includes(hookName);
  });

  if (hooks.length === 0) {
    return null;
  }

  let content = `/**
 * @module @unchainedshop/client/${moduleName}
 * Auto-generated barrel export file
 * Generated on: ${new Date().toISOString()}
 */

`;

  content += '// Hooks\n';
  hooks.forEach(file => {
    const exportName = getExportName(file);
    const filePath = path.join(hooksDir, file);

    if (hasNamedExport(filePath, exportName)) {
      content += `export { ${exportName} } from './hooks/${exportName}';\n`;
    } else if (hasDefaultExport(filePath)) {
      content += `export { default as ${exportName} } from './hooks/${exportName}';\n`;
    } else {
      content += `export { default as ${exportName} } from './hooks/${exportName}';\n`;
    }
  });

  return content;
}

function main() {
  console.log('🚀 Generating module exports...\n');

  const modules = fs.readdirSync(MODULES_DIR).filter(item => {
    const itemPath = path.join(MODULES_DIR, item);
    return fs.statSync(itemPath).isDirectory() && !SKIP_MODULES.includes(item);
  });

  let generatedCount = 0;
  let skippedCount = 0;

  modules.forEach(moduleName => {
    const modulePath = path.join(MODULES_DIR, moduleName);
    const indexPath = path.join(modulePath, 'index.ts');

    const content = generateModuleIndex(moduleName, modulePath);

    if (content) {
      fs.writeFileSync(indexPath, content);
      console.log(`✅ Generated: ${moduleName}/index.ts`);
      generatedCount++;
    } else {
      skippedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Generated: ${generatedCount} modules`);
  console.log(`   Skipped: ${skippedCount} modules`);
  console.log(`   Total scanned: ${modules.length} modules\n`);
}

main();

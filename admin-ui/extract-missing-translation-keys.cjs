const fs = require('fs');
const en = JSON.parse(fs.readFileSync('./src/i18n/en.json', 'utf-8'));
const dePath = './src/i18n/de.json';
const de = JSON.parse(fs.readFileSync(dePath, 'utf-8'));
let addedCount = 0;
for (const key in en) {
  if (!(key in de)) {
    de[key] = null;
    addedCount++;
  }
}
fs.writeFileSync(dePath, JSON.stringify(de, null, 2), 'utf-8');
console.log(`✅ Added ${addedCount} missing keys to de.json with null values.`);

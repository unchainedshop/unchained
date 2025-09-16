const fs = require('fs');
const path = require('path');
const { getProcessedPermissions } = require('./src/lib/permissionConfig');

const output = `window.AdminUiPermissions = ${getProcessedPermissions()};`;
fs.writeFileSync(
  path.join(__dirname, './public/admin-ui-permissions.js'),
  output,
  'utf8',
);
console.log('✅ Permissions JS file generated.');

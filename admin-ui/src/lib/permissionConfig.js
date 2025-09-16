// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadPermissionConfig = require('../../loadPermissionConfig');

function getProcessedPermissions() {
  const permissionConfig = loadPermissionConfig();
  return permissionConfig;
}

module.exports = { getProcessedPermissions };

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
// permissionConfig.js
const defaultConfig = require('./default-permissions.config');

function loadPermissionConfig() {
  const userConfigPath = process.env.UI_PERMISSION_CONFIG;
  if (userConfigPath) {
    try {
      // Attempt to load user-specified config file
      const permissionConfig = require(`${userConfigPath}`);
      console.info(
        `Loaded user-specified permission config successfully: ${userConfigPath}`,
      );
      return permissionConfig;
    } catch (error) {
      // If user-specified config file fails to load, fallback to default
      console.error(
        `Failed to load user-specified permission config: ${error.message}`,
      );
    }
  }

  console.warn(`Falling back to default permission config`);
  return defaultConfig;
}

module.exports = loadPermissionConfig;

require('dotenv-extended').load({
  schema: '../../.env.schema',
  silent: process.env.SUPPRESS_ENV_ERRORS,
  errorOnMissing: false,
  errorOnRegex: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnExtra: !process.env.SUPPRESS_ENV_ERRORS,
  includeProcessEnv: true,
});
require('./file_env.js');

require('dotenv-extended').load({
  silent: process.env.SUPPRESS_ENV_ERRORS,
  errorOnMissing: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnRegex: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnExtra: false,
  includeProcessEnv: true,
});
require('./file_env');

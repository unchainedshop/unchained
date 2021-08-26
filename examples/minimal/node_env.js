require('dotenv-extended').load({
  silent: process.env.SUPPRESS_ENV_ERRORS,
  errorOnMissing: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnRegex: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnExtra: !process.env.SUPPRESS_ENV_ERRORS,
  includeProcessEnv: true,
});
require('./file_env');

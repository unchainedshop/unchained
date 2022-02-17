const suppress = process.env.SUPPRESS_ENV_ERRORS
require('dotenv-extended').load({
  silent: suppress,
  errorOnMissing: !suppress,
  errorOnRegex: !suppress,
  errorOnExtra: !suppress,
  includeProcessEnv: true,
});
require('./file_env.js');

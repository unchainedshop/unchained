import dotenv from 'dotenv-extended';
import fs from 'fs';

dotenv.load({
  silent: Boolean(process.env.SUPPRESS_ENV_ERRORS),
  errorOnRegex: !process.env.SUPPRESS_ENV_ERRORS,
  errorOnMissing: false,
  errorOnExtra: false,
  includeProcessEnv: true,
});

// Load _FILE env's
Object.entries(process.env)
  .filter(([key]) => key.substr(-5) === '_FILE')
  .forEach(([key, path]) => {
    try {
      const stats = fs.statSync(path);
      if (stats.isFile()) {
        const value = fs.readFileSync(path, 'utf8');
        const envVarName = key.substr(0, key.length - 5);
        process.env[envVarName] = value;
      }
    } catch {} // eslint-disable-line
  });

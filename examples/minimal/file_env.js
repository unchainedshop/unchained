const fs = require('fs');

// eslint-disable-next-line
console.log('Docker Helper: Load _FILE env into env at App Startup');

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
    } catch (e) {} // eslint-disable-line
  });

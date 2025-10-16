import fs from 'node:fs';

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
    } catch {}
  });

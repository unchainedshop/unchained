module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      port: 4011,
    },
    binary: {
      version: '8.0.0',
      skipMD5: true,
    },
    autoStart: false,
  },
  useSharedDBForAllJestWorkers: true,
};

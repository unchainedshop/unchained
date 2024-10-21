module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      port: 4011,
    },
    autoStart: false,
  },
  useSharedDBForAllJestWorkers: true,
};

module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      port: 4011,
    },
    binary: {
      version: '5.0.5',
      skipMD5: true,
    },
    autoStart: false,
  },
};

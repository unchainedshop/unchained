module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      port: 4011,
    },
    binary: {
      version: '3.6.10',
      skipMD5: true
    },
    autoStart: false
  }
};

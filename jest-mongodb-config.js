module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      port: 4011
    },
    binary: {
      version: '4.0.3',
      skipMD5: true
    },
    autoStart: false
  }
};

module.exports = async function(globalConfig) {
  await global.__MONGOD__.stop();
  await global.__SUBPROCESS_METEOR__.kill('SIGHUP');
};

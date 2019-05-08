module.exports = async function(globalConfig) {
  await global.__MONGOD__.stop();
  global.__SUBPROCESS_METEOR__.unref()
  if (!globalConfig.watch && !globalConfig.watchAll) {
    global.__SUBPROCESS_METEOR__.kill('SIGHUP');
  }
};


function exitHandler(options, exitCode) {
  // cleanup processes
  global.__SUBPROCESS_METEOR__.kill('SIGHUP');
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

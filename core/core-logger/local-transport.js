import Transport from 'winston-transport';

class LocalTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.Logs = opts.db;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Perform the writing to the remote service
    const { level, message } = info;
    try {
      this.Logs.insert({
        created: new Date(),
        level,
        message,
      });
    } catch (e) {
      console.trace(e); // eslint-disable-line
    }

    callback();
  }
}

export default LocalTransport;

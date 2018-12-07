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
    const {
      level, message, ...meta
    } = info;
    try {
      this.Logs.insert({
        created: new Date(),
        level,
        message,
        meta,
      });
    } catch (e) {
      console.trace(e); // eslint-disable-line
    }

    callback();
  }
}

export default LocalTransport;

import Transport from 'winston-transport';

export default class LocalTransport extends Transport {
  constructor(options, ...rest) {
    super(options, ...rest);
    this.Logs = options.db;
  }
  log(level, message, meta, callback) { // eslint-disable-line
    try {
      this.Logs.insert({
        created: new Date(),
        level,
        message,
        ...meta,
      });
    } catch (e) {
      console.trace(e); // eslint-disable-line
    }

    // Perform the writing to the remote service
    callback();
  }
}

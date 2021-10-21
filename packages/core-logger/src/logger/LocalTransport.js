import Transport from 'winston-transport';

export class LocalTransport extends Transport {
  Logs;

  constructor(opts) {
    super(opts);
    this.Logs = opts.Logs;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // eslint-disable-next-line
    const { level: formattedLevel, message, ...meta } = info;

    const level = info[Symbol.for('level')];
    setTimeout(() => {
      try {
        Logs.insert({
          created: new Date(),
          level,
          message,
          meta,
        });
      } catch (e) {
        console.trace(e); // eslint-disable-line
      }
    }, 0);

    callback();
  }
}

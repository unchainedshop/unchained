/* eslint-disable no-useless-constructor */
import Transport from 'winston-transport';
import { Meteor } from 'meteor/meteor';
import { Logs } from './db/collections';

class LocalTransport extends Transport {
  constructor(obj) {
    super(obj);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // eslint-disable-next-line
    const { level: formattedLevel, message, ...meta } = info;

    const level = info[Symbol.for('level')];
    Meteor.defer(() => {
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
    });
    callback();
  }
}

export default LocalTransport;

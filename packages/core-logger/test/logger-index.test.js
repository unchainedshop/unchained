import { assert } from 'chai';
import { initDb } from 'meteor/unchained:core-mongodb';

import {
  log,
  configureLogs,
  createLogger,
  transports,
  format,
  LogLevel,
} from 'meteor/unchained:core-logger';

describe('Test exports', () => {
  it('Configure Logs', async () => {
    assert.isDefined(configureLogs);
    const db = initDb();
    const module = await configureLogs({ db });

    assert.ok(module);
    assert.isFunction(module.log);
    assert.isFunction(module.findLogs);
    assert.isFunction(module.count);
  });

  it('Utils', () => {
    assert.isFunction(createLogger);
    assert.isFunction(format);
    assert.isObject(transports);
    assert.isFunction(log);
    log('Test', LogLevel.Warn);
  });
});

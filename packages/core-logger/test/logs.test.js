import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb'

import configureLogger, {
  configureLogs,
  createLogger,
  transports,
  format,
} from 'meteor/unchained:core-logger';

describe('Test exports', () => {
  it('Configure Logs', () => {
    assert.isDefined(configureLogs);
    const module = configureLogs({ db });
    assert.ok(module)
    assert.isFunction(module.log)
    assert.isFunction(module.findLogs)
    assert.isFunction(module.count)
  });

  it('Utils', () => {
    assert.isFunction(createLogger);
    assert.isFunction(format);
    assert.isObject(transports);
  });
});

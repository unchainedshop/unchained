import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb';

import {
  configureLogs,
  createLogger,
  transports,
  format,
} from 'meteor/unchained:core-logger';

describe('Test exports', () => {
  it('Configure Logs', async () => {
    assert.isDefined(configureLogs);
    const module = await configureLogs({ db });

    console.log('MODULE', module)
    assert.ok(module);
    assert.isFunction(module.log);
    assert.isFunction(module.findLogs);
    assert.isFunction(module.count);
  });

  it('Utils', () => {
    assert.isFunction(createLogger);
    assert.isFunction(format);
    assert.isObject(transports);
  });
});

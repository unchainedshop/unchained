import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb'

import configureLogger, {
  configureLogs,
  createLogger,
  transports,
  format,
} from 'meteor/unchained:core-logger';

describe('Test exports', () => {
  it('Configure Logs', async () => {
    assert.isDefined(configureLogs);
    console.log('DB', db)
    const module = configureLogs({ db });
    assert.ok(module)
    console.log('MODULE', module)
  });

  it('Utils', async () => {
    assert.isFunction(createLogger);
    assert.isFunction(format);
    assert.isObject(transports);
  });
});

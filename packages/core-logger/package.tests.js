import { assert } from 'chai';
import configureLogger, {
  Logger,
  log,
  createLogger,
  transports,
  format,
} from 'meteor/unchained:core-logger';

describe('Test exports', () => {
  it('Configure Logger', async () => {
    assert.isDefined(configureLogger)
    configureLogger()
  });

  it('Utils', async () => {
    assert.isFunction(log);
    assert.isFunction(createLogger);
    assert.isFunction(format);

    assert.isObject(transports);
  });
});

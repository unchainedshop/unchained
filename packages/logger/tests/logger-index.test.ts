import { assert } from 'chai';

import {
  log,
  createLogger,
  transports,
  format,
  LogLevel,
} from '../src/logger-index';

describe('Test exports', () => {
  it('log', () => {
    assert.isFunction(log);
    log('Test', { level: LogLevel.Warning });
  });
  it('createLogger', () => {
    assert.isFunction(createLogger);
    assert.isFunction(format);
    assert.isObject(transports);
    const logger = createLogger('unchained:test');
    logger.info('Test Logger', 'With additional info');
  });
});

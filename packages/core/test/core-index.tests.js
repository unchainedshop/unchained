import { assert } from "chai"
import { initCore } from "./src/core-index"
import { log, LogLevel } from 'unchained-core-logger';
import { emit, registerEvents, EventDirector, EventAdapter } from 'unchained-core-events'

describe('Initialisation', () => {
  it('Init core without parameters', async () => {
    const config = await initCore({});

    assert.ok(config.modules)
    assert.ok(config.services)
  })

  it('Check global actions', async () => {
    assert.isFunction(log);
    log('Test message', { level: LogLevel.Warning })

    assert.isFunction(emit);
    assert.isFunction(registerEvents);

    registerEvents(['TEST_EVENT'])
    emit('TEST_EVENT')
  });
})
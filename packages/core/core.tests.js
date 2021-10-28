import { assert } from "chai"
import { initCore } from "./core"
import { log, LogLevel } from 'unchained-core-logger';
import { emitEvent, registerEvents, EventDirector, EventAdapter } from 'unchained-core-events'

describe('Initialisation', () => {
  it('Init core without parameters', async () => {
    const config = await initCore({});

    assert.ok(config.modules)
    assert.ok(config.services)
    console.log(config);
  })

  it('Check global actions', async () => {
    assert.isFunction(log);
    log('Test message', { level: LogLevel.Warning })

    assert.isFunction(emitEvent);
    assert.isFunction(registerEvents);

    registerEvents(['TEST_EVENT'])
    emitEvent('TEST_EVENT')
  });
})
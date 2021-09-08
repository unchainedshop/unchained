import { assert } from "chai"
import { initCore } from "./core"

describe('Initialisation', () => {
  it('Init core without parameters', async () => {
    const config = await initCore({});

    assert.ok(config.modules)
    assert.ok(config.services)
    console.log(config);
  })
})
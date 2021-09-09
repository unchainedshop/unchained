import { assert } from 'chai';
import { db } from 'meteor/unchained:core-mongodb';
import { configureEvents } from 'meteor/unchained:core-events';

describe('Test exports', () => {
  it('Configure Events', () => {
    assert.isDefined(configureEvents);
    const module = configureEvents({ db });
    assert.ok(module);
    assert.isFunction(module.registerEvents);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import _switch from './switch.js';

describe('switch', () => {
  it('returns undefined if no value is provided', () => {
    const values = [];
    const result = _switch(values);
    assert.deepStrictEqual(result, [undefined]);
  });

  it('returns true if a truthy value is provided', () => {
    const values = ['true'];
    const result = _switch(values);
    assert.deepStrictEqual(result, ['true']);
  });

  it('returns false if a falsy value is provided', () => {
    const values = ['false'];
    const result = _switch(values);
    assert.deepStrictEqual(result, ['false']);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import _switch from './switch.ts';

describe('switch', () => {
  it('returns undefined if no value is provided', () => {
    const values: string[] = [];
    const result = _switch(values);
    assert.deepStrictEqual(result, ['true']);
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

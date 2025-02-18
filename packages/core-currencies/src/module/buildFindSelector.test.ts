import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureCurrenciesModule.js';

describe('buildFindSelector', () => {
  it('should return correct filter object', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
        includeInactive: true,
        queryString: 'hello world',
      }),
      {
        deleted: null,
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
        $text: { $search: 'hello world' },
      },
    );
    assert.deepStrictEqual(
      buildFindSelector({
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
        includeInactive: true,
      }),
      {
        deleted: null,
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
      },
    );
    assert.deepStrictEqual(buildFindSelector({ includeInactive: true, queryString: 'hello world' }), {
      deleted: null,
      $text: { $search: 'hello world' },
    });
    assert.deepStrictEqual(buildFindSelector({ queryString: 'hello world' }), {
      deleted: null,
      isActive: true,
      $text: { $search: 'hello world' },
    });
  });
});

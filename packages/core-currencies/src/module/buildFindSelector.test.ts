import { buildFindSelector } from './configureCurrenciesModule.js';

describe('buildFindSelector', () => {
  it('should return correct filter object', () => {
    expect(
      buildFindSelector({
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
        includeInactive: true,
        queryString: 'hello world',
      }),
    ).toEqual({
      deleted: null,
      contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
      $text: { $search: 'hello world' },
    });
    expect(
      buildFindSelector({
        contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
        includeInactive: true,
      }),
    ).toEqual({
      deleted: null,
      contractAddress: '0xf12EC0F79a8855d093DeCe22b24c0603f5b8E34A',
    });
    expect(buildFindSelector({ includeInactive: true, queryString: 'hello world' })).toEqual({
      deleted: null,
      $text: { $search: 'hello world' },
    });
    expect(buildFindSelector({ queryString: 'hello world' })).toEqual({
      deleted: null,
      isActive: true,
      $text: { $search: 'hello world' },
    });
  });
});

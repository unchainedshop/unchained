import {
    describe,
    test,
    expect,
    it,
    beforeAll,
    afterAll,
    afterEach,
    jest,
  } from '@jest/globals';
  
  import parser from './range';
  
  const productIds = {
    0: ['A'],
    50: ['B', 'C', 'D'],
    100: ['E', 'F', 'G', 'H', 'I'],
    Infinity: ['J', 'K', 'L', 'M', 'N', 'O', 'P'],
  };
  
  const allProductIds = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];
  
  describe('Filter Value Parser: Range', () => {
    it('should return all product ids if filter not set', () => {
      expect(parser(productIds, allProductIds)([])).arrayContaining(['Z']);
      expect(parser(productIds, allProductIds)([undefined])).arrayContaining([
        'Z',
      ]);
    });
  });
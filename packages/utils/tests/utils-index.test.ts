
import { SortDirection } from '@unchainedshop/types/api.js';
import {
  buildSortOptions,
  checkId,
  findLocalizedText,
  findPreservingIds,
  findUnusedSlug,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
  generateRandomHash,
  objectInvert,
  pipePromises,
  resolveBestCountry,
  resolveBestSupported,
  resolveUserRemoteAddress,
  
  slugify,
  systemLocale,
} from '@unchainedshop/utils';
import generateHashId from '../lib/generate-random-hash.js'

describe('Utils', () => {

  it('Locale', () => {
    expect(systemLocale).toBeDefined();
    expect(resolveBestCountry).toBeInstanceOf(Function)
    expect(resolveBestSupported).toBeInstanceOf(Function)
    expect(resolveUserRemoteAddress).toBeInstanceOf(Function)
  });
  it('functions', () => {

    expect(findLocalizedText).toBeInstanceOf(Function)
    expect(objectInvert).toBeInstanceOf(Function)
    expect(findPreservingIds).toBeInstanceOf(Function)
    expect(findUnusedSlug).toBeInstanceOf(Function)
    expect(slugify).toBeInstanceOf(Function)
    expect(pipePromises).toBeInstanceOf(Function)
    expect(generateDbFilterById).toBeInstanceOf(Function)
    expect(generateRandomHash).toBeInstanceOf(Function)
    expect(generateDbMutations).toBeInstanceOf(Function)
  });

  describe('buildSortOptions', () => {
    it('should return the correct db sort format', () => {
      const sort = [    { key: 'name', value: SortDirection.ASC },    { key: 'age', value: SortDirection.DESC },  ];
      expect(buildSortOptions(sort)).toEqual({ name: 1, age: -1 });
    })
    
  });
  
  describe('checkId', () => {
    it('with a string value', () => {
      const value = '12345';
      const error = { message: 'Invalid id' };
    
      expect(() => checkId(value, error)).not.toThrow();
    });
    
    it('with a non-string value', () => {
      const value: any = 12345;
      const error = { message: 'Invalid id' };
    
      expect(() => checkId(value, error)).toThrow('Invalid id');
    });
    
    it('with a different error object', () => {
      const value:any = 12345;
      const error = { message: 'Invalid id', path: 'name' };
    
      expect(() => checkId(value, error)).toThrow('Invalid id');
    });
    
    it('without an error object', () => {
      const value: any = 12345;
    
      expect(() => checkId(value)).toThrow();
    });
    
  });
describe('generateDbObjectId', () => {
  it('generateDbObjectId with default digits', () => {
    const result = generateDbObjectId();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(24);
  });
  
  it('generateDbObjectId with odd digits', () => {
    const result = generateDbObjectId(23);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(23);
  });
  
  it('generateDbObjectId with even digits', () => {
    const result = generateDbObjectId(24);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(24);
  });
  
})

describe('generateHashId', () => {
  it('should create a random hash ', () => {
  const result = generateHashId();

  expect(typeof result).toBe('string');
  expect(result).toMatch(/^[A-Z0-9]+$/);
})
});

describe('slugify', () => {
  it('with a normal string', () => {
    const text = 'The Quick Brown Fox Jumps Over The Lazy Dog';
    const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';
  
    const result = slugify(text);
  
    expect(result).toEqual(expected);
  });
  
  it('with a string containing special characters', () => {
    const text = 'The Quick Brown Fox! Jumps Over The Lazy Dog?';
    const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';
  
    const result = slugify(text);
  
    expect(result).toEqual(expected);
  });
  
  it('with a string containing multiple spaces', () => {
    const text = 'The Quick   Brown Fox    Jumps Over The Lazy Dog';
    const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';
  
    const result = slugify(text);
  
    expect(result).toEqual(expected);
  });
    
  it('with a string containing only special characters (leave underscore)', () => {
    const text = '!@#$%^&*()_+';
    const expected = '_';
  
    const result = slugify(text);
  
    expect(result).toEqual(expected);
  });
  
})
  
});



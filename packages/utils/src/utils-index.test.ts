import {
  resolveBestCountry,
  resolveBestSupported,
  resolveUserRemoteAddress,
  slugify,
  systemLocale,
} from '@unchainedshop/utils';
import generateHashId from './generate-random-hash.js'

describe('Utils', () => {

  it('Locale', () => {
    expect(systemLocale).toBeDefined();
    expect(resolveBestCountry).toBeInstanceOf(Function)
    expect(resolveBestSupported).toBeInstanceOf(Function)
    expect(resolveUserRemoteAddress).toBeInstanceOf(Function)
  });

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



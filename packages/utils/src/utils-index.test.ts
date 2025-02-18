import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveBestCountry, resolveBestSupported, slugify, systemLocale } from './utils-index.js';
import generateHashId from './generate-random-hash.js';

describe('Utils', () => {
  it('Locale', () => {
    assert.ok(systemLocale);
    assert.equal(typeof resolveBestCountry, 'function');
    assert.equal(typeof resolveBestSupported, 'function');
  });

  describe('generateHashId', () => {
    it('should create a random hash', () => {
      const result = generateHashId();

      assert.equal(typeof result, 'string');
      assert.match(result, /^[A-Z0-9]+$/);
    });
  });

  describe('slugify', () => {
    it('with a normal string', () => {
      const text = 'The Quick Brown Fox Jumps Over The Lazy Dog';
      const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';

      const result = slugify(text);

      assert.equal(result, expected);
    });

    it('with a string containing special characters', () => {
      const text = 'The Quick Brown Fox! Jumps Over The Lazy Dog?';
      const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';

      const result = slugify(text);

      assert.equal(result, expected);
    });

    it('with a string containing multiple spaces', () => {
      const text = 'The Quick   Brown Fox    Jumps Over The Lazy Dog';
      const expected = 'the-quick-brown-fox-jumps-over-the-lazy-dog';

      const result = slugify(text);

      assert.equal(result, expected);
    });

    it('with a string containing only special characters (leave underscore)', () => {
      const text = '!@#$%^&*()_+';
      const expected = '_';

      const result = slugify(text);

      assert.equal(result, expected);
    });
  });
});

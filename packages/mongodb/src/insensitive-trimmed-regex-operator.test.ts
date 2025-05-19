import { describe, it } from 'node:test';
import assert from 'node:assert';
import { insensitiveTrimmedRegexOperator } from './insensitive-trimmed-regex-operator.js';

/* eslint-disable no-useless-escape */

describe('Insensitive Trimmed Regex Operator', () => {
  it('should accept + mails', () => {
    const input = 'test+test@test.com';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^test\+test@test\.com$/i,
    });
  });

  it('should trim mails', () => {
    const input = ' test-two+test@test.com';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^test\-two\+test@test\.com$/i,
    });
  });

  it('should not transform case', () => {
    const input = ' tesT+tesT@test.com ';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^tesT\+tesT@test\.com$/i,
    });
  });

  // New tests to verify security improvements

  it('should escape all regex special characters', () => {
    const input = '.*+?^${}()|[]\\';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^\.\*\+\?\^\$\{\}\(\)\|\[\]\\$/i,
    });
  });

  it('should properly escape hyphens', () => {
    const input = 'range-a-z';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^range\-a\-z$/i,
    });
  });

  it('should properly escape forward slashes', () => {
    const input = 'path/to/file';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^path\/to\/file$/i,
    });
  });

  it('should handle malicious pattern attempts', () => {
    const input = '[a-z]|[0-9]';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^\[a\-z\]\|\[0\-9\]$/i,
    });
  });

  it('should reject empty strings after trimming', () => {
    assert.throws(() => {
      insensitiveTrimmedRegexOperator('   ');
    }, /String is empty after trimming/);
  });

  it('should reject non-string inputs', () => {
    assert.throws(() => {
      insensitiveTrimmedRegexOperator(123);
    }, /Expected a string/);
  });

  it('should reject strings exceeding maximum length', () => {
    const longString = 'a'.repeat(256);
    assert.throws(() => {
      insensitiveTrimmedRegexOperator(longString);
    }, /String exceeds maximum allowed length/);
  });
});

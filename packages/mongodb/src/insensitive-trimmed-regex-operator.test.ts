import { describe, it } from 'node:test';
import assert from 'node:assert';
import { insensitiveTrimmedRegexOperator } from './insensitive-trimmed-regex-operator.js';

describe('Email Regex Operator', () => {
  it('should accept + mails', () => {
    const input = 'test+test@test.com';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^test\+test@test\.com$/i,
    });
  });

  it('should trim mails', () => {
    const input = ' test-two+test@test.com';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^test-two\+test@test\.com$/i,
    });
  });

  it('should not transform case', () => {
    const input = ' tesT+tesT@test.com ';
    assert.deepStrictEqual(insensitiveTrimmedRegexOperator(input), {
      $regex: /^tesT\+tesT@test\.com$/i,
    });
  });
});

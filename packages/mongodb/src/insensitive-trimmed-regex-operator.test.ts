import { insensitiveTrimmedRegexOperator } from './insensitive-trimmed-regex-operator.js';

describe('Email Regex Operator', () => {
  it('should accept + mails', () => {
    const input = 'test+test@test.com';
    expect(insensitiveTrimmedRegexOperator(input)).toEqual({ $regex: /^test\+test@test\.com$/i });
  });
  it('should trim mails', () => {
    const input = ' test-two+test@test.com';
    expect(insensitiveTrimmedRegexOperator(input)).toEqual({ $regex: /^test-two\+test@test\.com$/i });
  });
  it('should not transform case', () => {
    const input = ' tesT+tesT@test.com ';
    expect(insensitiveTrimmedRegexOperator(input)).toEqual({ $regex: /^tesT\+tesT@test\.com$/i });
  });
});

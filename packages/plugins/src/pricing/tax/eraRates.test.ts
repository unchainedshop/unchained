import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compileEraRates, rateForDate } from './eraRates.ts';

const ERAS = [
  { validFrom: '2024-01-01', rate: 0.081 },
  { validFrom: '2018-01-01', rate: 0.077 },
  { validFrom: '2011-01-01', rate: 0.08 },
];

describe('compileEraRates', () => {
  it('sorts eras ascending by validFrom regardless of input order', () => {
    const compiled = compileEraRates(ERAS, '+01:00');
    assert.deepStrictEqual(
      compiled.map(({ rate }) => rate),
      [0.08, 0.077, 0.081],
    );
  });

  it('anchors era boundaries at midnight of the given UTC offset', () => {
    const [first] = compileEraRates([{ validFrom: '2024-01-01', rate: 0.081 }], '+01:00');
    assert.strictEqual(first.validFrom, new Date('2024-01-01T00:00:00.000+01:00').getTime());
  });
});

describe('rateForDate', () => {
  const rate = rateForDate(compileEraRates(ERAS, '+01:00'));

  it('resolves the era containing the reference date', () => {
    assert.strictEqual(rate(new Date('2015-06-15T12:00:00Z')), 0.08);
    assert.strictEqual(rate(new Date('2020-06-15T12:00:00Z')), 0.077);
    assert.strictEqual(rate(new Date('2026-06-15T12:00:00Z')), 0.081);
  });

  it('switches exactly at the era boundary', () => {
    assert.strictEqual(rate(new Date('2023-12-31T23:59:59.999+01:00')), 0.077);
    assert.strictEqual(rate(new Date('2024-01-01T00:00:00.000+01:00')), 0.081);
  });

  it('clamps dates before the first era to the earliest known rate', () => {
    assert.strictEqual(rate(new Date('1999-01-01T00:00:00Z')), 0.08);
  });

  it('defaults to the current date', () => {
    assert.strictEqual(rate(), 0.081);
  });
});

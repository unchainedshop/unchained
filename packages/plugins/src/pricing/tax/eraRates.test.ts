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
    const compiled = compileEraRates(ERAS, 'Europe/Zurich');
    assert.deepStrictEqual(
      compiled.map(({ rate }) => rate),
      [0.08, 0.077, 0.081],
    );
  });

  it('retains the civil effective date and IANA time zone', () => {
    const [first] = compileEraRates([{ validFrom: '2024-01-01', rate: 0.081 }], 'Europe/Zurich');
    assert.deepStrictEqual(first, {
      validFrom: '2024-01-01',
      rate: 0.081,
      timeZone: 'Europe/Zurich',
    });
  });

  it('rejects invalid civil dates and time zones', () => {
    assert.throws(() => compileEraRates([{ validFrom: '2025-02-29', rate: 0.1 }], 'Europe/Zurich'));
    assert.throws(() => compileEraRates(ERAS, 'Europe/Not_A_Zone'));
  });
});

describe('rateForDate', () => {
  const rate = rateForDate(compileEraRates(ERAS, 'Europe/Zurich'));

  it('resolves the era containing the reference date', () => {
    assert.strictEqual(rate(new Date('2015-06-15T12:00:00Z')), 0.08);
    assert.strictEqual(rate(new Date('2020-06-15T12:00:00Z')), 0.077);
    assert.strictEqual(rate(new Date('2026-06-15T12:00:00Z')), 0.081);
  });

  it('switches exactly at the era boundary', () => {
    assert.strictEqual(rate(new Date('2023-12-31T23:59:59.999+01:00')), 0.077);
    assert.strictEqual(rate(new Date('2024-01-01T00:00:00.000+01:00')), 0.081);
  });

  it('uses the jurisdiction local date across DST and non-Central-European zones', () => {
    const bucharestRate = rateForDate(
      compileEraRates(
        [
          { validFrom: '2017-01-01', rate: 0.19 },
          { validFrom: '2025-08-01', rate: 0.21 },
        ],
        'Europe/Bucharest',
      ),
    );
    assert.strictEqual(bucharestRate(new Date('2025-07-31T20:59:59.999Z')), 0.19);
    assert.strictEqual(bucharestRate(new Date('2025-07-31T21:00:00.000Z')), 0.21);
  });

  it('clamps dates before the first era to the earliest known rate', () => {
    assert.strictEqual(rate(new Date('1999-01-01T00:00:00Z')), 0.08);
  });

  it('defaults to the current date', () => {
    assert.strictEqual(rate(), 0.081);
  });
});

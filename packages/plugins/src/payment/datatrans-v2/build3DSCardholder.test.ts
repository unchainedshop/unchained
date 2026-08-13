import { describe, it } from 'node:test';
import assert from 'node:assert';
import build3DSCardholder, {
  withCardCardholder,
  withSecureFieldsCardholder,
} from './build3DSCardholder.ts';

describe('build3DSCardholder', () => {
  it('builds name, email and homePhone from order data', () => {
    const cardholder = build3DSCardholder({
      billingAddress: { firstName: 'John', lastName: 'Doe', countryCode: 'CH' },
      contact: { emailAddress: 'john@example.com', telNumber: '+41791234567' },
    } as any);
    assert.deepStrictEqual(cardholder, {
      cardholderName: 'John Doe',
      email: 'john@example.com',
      homePhone: { cc: '41', subscriber: '791234567' },
    });
  });

  it('splits a national number using the billing country', () => {
    const cardholder = build3DSCardholder({
      billingAddress: { firstName: 'John', lastName: 'Doe', countryCode: 'CH' },
      contact: { telNumber: '079 123 45 67' },
    } as any);
    assert.deepStrictEqual(cardholder?.homePhone, { cc: '41', subscriber: '791234567' });
  });

  it('omits fields that are empty or unparseable', () => {
    const cardholder = build3DSCardholder({
      billingAddress: { firstName: 'John' },
      contact: { telNumber: 'not-a-phone' },
    } as any);
    assert.deepStrictEqual(cardholder, { cardholderName: 'John' });
  });

  it('returns undefined when there is no usable data', () => {
    assert.strictEqual(build3DSCardholder(undefined), undefined);
    assert.strictEqual(build3DSCardholder({ contact: {}, billingAddress: {} } as any), undefined);
  });
});

const cardholder = {
  cardholderName: 'John Doe',
  email: 'john@example.com',
  homePhone: { cc: '41', subscriber: '791234567' },
};

describe('withCardCardholder (init / redirect endpoint)', () => {
  it('nests the cardholder under card.3D.cardholder', () => {
    const result = withCardCardholder({ amount: 1000 }, cardholder);
    assert.deepStrictEqual(result, { amount: 1000, card: { '3D': { cardholder } } });
  });

  it('preserves existing card properties and lets caller cardholder fields win', () => {
    const result = withCardCardholder(
      { card: { alias: 'abc', '3D': { cardholder: { email: 'override@example.com' } } } },
      cardholder,
    );
    assert.strictEqual(result.card.alias, 'abc');
    assert.strictEqual(result.card['3D'].cardholder.email, 'override@example.com');
    assert.strictEqual(result.card['3D'].cardholder.cardholderName, 'John Doe');
  });

  it('returns input unchanged when there is no cardholder', () => {
    const input = { amount: 1000 };
    assert.strictEqual(withCardCardholder(input, undefined), input);
  });
});

describe('withSecureFieldsCardholder (secureFields endpoint)', () => {
  it('nests the cardholder under a top-level 3D.cardholder (no card property)', () => {
    const result = withSecureFieldsCardholder({ currency: 'CHF' }, cardholder);
    assert.deepStrictEqual(result, { currency: 'CHF', '3D': { cardholder } });
    assert.strictEqual(result.card, undefined);
  });

  it('returns input unchanged when there is no cardholder', () => {
    const input = { currency: 'CHF' };
    assert.strictEqual(withSecureFieldsCardholder(input, undefined), input);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildLocaleMap from './buildLocaleMap.ts';

const testTexts = [
  // 1 has translations in French and German
  { locale: 'fr', _id: '1', entityId: '1' },
  { locale: 'de', _id: '2', entityId: '1' },

  // 2 only has Ialien translations
  { locale: 'it', _id: '3', entityId: '2' },

  // 3 only has English translations
  { locale: 'en', _id: '4', entityId: '3' },

  // 4 only has German translations
  { locale: 'de', _id: '5', entityId: '4' },
];

describe('buildLocaleMap', () => {
  it('Mixed usage of default locale and forced languages', () => {
    const queries = [
      { locale: new Intl.Locale('de-CH') },
      { locale: new Intl.Locale('fr') },
      { locale: new Intl.Locale('it') },
    ];
    const expected = {
      de: ['de-CH', 'fr', 'it'],
      fr: ['fr'],
      it: ['it'],
    };
    const result = buildLocaleMap(queries, testTexts);
    assert.deepStrictEqual(result, expected);
  });

  it('Mixed usage of forced languages', () => {
    const queries = [{ locale: new Intl.Locale('fr') }, { locale: new Intl.Locale('it') }];
    const expected = {
      de: ['fr', 'it'],
      fr: ['fr'],
      it: ['it'],
    };
    const result = buildLocaleMap(queries, testTexts);
    assert.deepStrictEqual(result, expected);
  });

  it('Only default locale', () => {
    const queries = [{ locale: new Intl.Locale('de-CH') }];
    const expected = {
      de: ['de-CH'],
    };
    const result = buildLocaleMap(queries, testTexts);
    assert.deepStrictEqual(result, expected);
  });

  it('Only one forced language locale', () => {
    const queries = [{ locale: new Intl.Locale('fr') }];
    const expected = {
      fr: ['fr'],
      de: ['fr'],
    };
    const result = buildLocaleMap(queries, testTexts);
    assert.deepStrictEqual(result, expected);
  });
});

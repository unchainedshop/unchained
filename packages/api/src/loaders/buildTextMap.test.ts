import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildTextMap from './buildTextMap.ts';

const testTexts = [
  // 1 has translations in French and German
  { locale: 'fr', _id: 'french-1', entityId: '1' },
  { locale: 'de', _id: 'german-1', entityId: '1' },

  // 2 only has Italian translations
  { locale: 'it', _id: 'italian-2', entityId: '2' },

  // 3 only has English translations
  { locale: 'en', _id: 'english-3', entityId: '3' },

  // 4 only has German translations
  { locale: 'de', _id: 'german-4', entityId: '4' },
];

describe('buildTextMap', () => {
  it('Generate a correct text map for all fallbacks', () => {
    const localeMap = {
      de: ['de-CH', 'fr', 'it'],
      fr: ['fr'],
      it: ['it'],
    };
    const expected = {
      'de-CH1': { _id: 'german-1' },
      fr1: { _id: 'french-1' },
      it1: { _id: 'german-1' },
      'de-CH4': { _id: 'german-4' },
      fr4: { _id: 'german-4' },
      it4: { _id: 'german-4' },
      it2: { _id: 'italian-2' },
    };
    const result = buildTextMap(localeMap, testTexts, (text) => text.entityId);
    assert.partialDeepStrictEqual(result, expected);
  });

  it('Empty texts array returns empty map', () => {
    const localeMap = { de: ['de', 'en'] };
    const result = buildTextMap(localeMap, [], (text: any) => text.entityId);
    assert.deepStrictEqual(result, {});
  });

  it('Empty localeMap returns empty map', () => {
    const texts = [{ locale: 'de', entityId: '1' }];
    const result = buildTextMap({}, texts, (text) => text.entityId);
    assert.deepStrictEqual(result, {});
  });

  it('Texts with undefined locale are skipped', () => {
    const localeMap = { de: ['de'] };
    const texts = [
      { locale: undefined, entityId: '1' },
      { locale: 'de', entityId: '2' },
    ];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    assert.deepStrictEqual(Object.keys(result), ['de2']);
  });

  it('Text locale not in localeMap is skipped', () => {
    const localeMap = { de: ['de'] };
    const texts = [{ locale: 'fr', entityId: '1' }];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    assert.deepStrictEqual(result, {});
  });

  it('Single text, single locale basic happy path', () => {
    const localeMap = { en: ['en'] };
    const texts = [{ locale: 'en', entityId: '1', title: 'Hello' }];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    assert.deepStrictEqual(result, { en1: texts[0] });
  });

  it('Exact match preferred over fallback', () => {
    // localeMap: both 'de' and 'en' map to query locale 'en'
    // 'de' is a fallback for 'en', 'en' is an exact match
    const localeMap = {
      de: ['en'],
      en: ['en'],
    };
    const texts = [
      { locale: 'de', entityId: '1', title: 'Hallo' },
      { locale: 'en', entityId: '1', title: 'Hello' },
    ];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    // The exact match (en) should win over the fallback (de)
    assert.strictEqual(result['en1'].title, 'Hello');
  });

  it('Multiple entities are independent', () => {
    const localeMap = { en: ['en'] };
    const texts = [
      { locale: 'en', entityId: '1', title: 'Product 1' },
      { locale: 'en', entityId: '2', title: 'Product 2' },
    ];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    assert.strictEqual(result['en1'].title, 'Product 1');
    assert.strictEqual(result['en2'].title, 'Product 2');
  });

  it('Composite buildId works correctly', () => {
    const localeMap = { en: ['en'] };
    const texts = [{ locale: 'en', entityId: '1', fieldName: 'title', value: 'Hello' }];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId + ':' + text.fieldName);
    assert.deepStrictEqual(Object.keys(result), ['en1:title']);
  });

  it('Duplicate texts (same locale, same entity) — last one wins', () => {
    const localeMap = { en: ['en'] };
    const texts = [
      { locale: 'en', entityId: '1', title: 'First' },
      { locale: 'en', entityId: '1', title: 'Second' },
    ];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);
    // Both are exact matches, so the last one overwrites
    assert.strictEqual(result['en1'].title, 'Second');
  });

  it('Two fallback locales competing for same query locale — localeMap key order determines winner', () => {
    // Both 'de' and 'fr' are fallbacks for query locale 'en'
    // Neither is an exact match, so the "skip if already set" logic applies
    // In the old version (localeMap keys first): the first key in localeMap wins
    // In the new version (texts first): the first text in the array wins
    const localeMap = {
      de: ['en'],
      fr: ['en'],
    };
    const texts = [
      { locale: 'fr', entityId: '1', title: 'Bonjour' },
      { locale: 'de', entityId: '1', title: 'Hallo' },
    ];
    const result = buildTextMap(localeMap, texts, (text) => text.entityId);

    // Old version iterates localeMap keys: 'de' key is processed first,
    // finds the 'de' text (second in array) and sets en1 = Hallo.
    // Then 'fr' key is processed, finds 'fr' text but en1 already exists
    // and 'en' !== 'fr' so it skips. Winner: 'de' (first localeMap key).
    assert.strictEqual(result['en1'].title, 'Hallo');
  });
});

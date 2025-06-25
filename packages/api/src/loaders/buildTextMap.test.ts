import { describe, it } from 'node:test';
import assert from 'node:assert';
import buildTextMap from './buildTextMap.js';

const testTexts = [
  // 1 has translations in French and German
  { locale: 'fr', _id: 'french-1', entityId: '1' },
  { locale: 'de', _id: 'german-1', entityId: '1' },

  // 2 only has Ialien translations
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
      'de-CH1': {
        _id: 'german-1',
      },
      fr1: {
        _id: 'french-1',
      },
      it1: {
        _id: 'german-1',
      },
      'de-CH4': {
        _id: 'german-4',
      },
      fr4: {
        _id: 'german-4',
      },
      it4: {
        _id: 'german-4',
      },
      it2: {
        _id: 'italian-2',
      },
    };
    const result = buildTextMap(localeMap, testTexts, (text) => text.entityId);

    assert.partialDeepStrictEqual(result, expected);
  });
});

import { assert } from 'chai';
import {
  findLocalizedText,
  findPreservingIds,
  findUnusedSlug,
  generateDbMutations,
  generateRandomHash,
  objectInvert,
  pipePromises,
  Schemas,
  slugify,
} from 'meteor/unchained:utils';

import {
  systemLocale,
  resolveBestSupported,
  resolveBestCountry,
  resolveUserRemoteAddress,
} from 'meteor/unchained:utils';

import './generate-db-mutations.test';

describe('Test exports', () => {
  it('Schemas', () => {
    assert.isDefined(Schemas);

    assert.isDefined(Schemas.Address);
    assert.isDefined(Schemas.Contact);
  });
  it('Locale', () => {
    assert.isDefined(systemLocale);
    assert.isFunction(resolveBestCountry);
    assert.isFunction(resolveBestSupported);
    assert.isFunction(resolveUserRemoteAddress);
  });
  it('Utils', () => {
    assert.isFunction(findLocalizedText);
    assert.isFunction(objectInvert);
    assert.isFunction(findPreservingIds);
    assert.isFunction(findUnusedSlug);
    assert.isFunction(slugify);
    assert.isFunction(pipePromises);
    assert.isFunction(generateRandomHash);
    assert.isFunction(generateDbMutations);
  });
});
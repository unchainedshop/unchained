import { assert } from 'chai';
import {
  Schemas,
  findLocalizedText,
  objectInvert,
  findPreservingIds,
  findUnusedSlug,
  slugify,
  getContext,
  pipePromises,
  generateRandomHash,
} from 'meteor/unchained:utils';

import {
  systemLocale,
  resolveBestSupported,
  resolveBestCountry,
  resolveUserRemoteAddress,
} from 'meteor/unchained:utils';

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
    assert.isFunction(getContext);
    assert.isFunction(pipePromises);
    assert.isFunction(generateRandomHash);
  });
});

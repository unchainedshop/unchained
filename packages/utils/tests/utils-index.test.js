import { assert } from 'chai';
import {
  findLocalizedText,
  findPreservingIds,
  findUnusedSlug,
  generateDbFilterById,
  generateDbMutations,
  generateRandomHash,
  objectInvert,
  pipePromises,
  resolveBestCountry,
  resolveBestSupported,
  resolveUserRemoteAddress,
  
  slugify,
  systemLocale,
} from '@unchainedshop/utils';


describe('Test exports', () => {

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
    assert.isFunction(generateDbFilterById);
    assert.isFunction(generateRandomHash);
    assert.isFunction(generateDbMutations);
  });
});

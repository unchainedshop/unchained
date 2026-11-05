import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { productsSettings } from './products-settings.ts';

describe('productsSettings.hideDrafts', () => {
  afterEach(async () => {
    await productsSettings.configureSettings({});
  });

  it('is off by default', async () => {
    await productsSettings.configureSettings({});
    assert.equal(productsSettings.hideDrafts, false);
  });

  it('is on when the option is set', async () => {
    await productsSettings.configureSettings({ hideDrafts: true });
    assert.equal(productsSettings.hideDrafts, true);
  });

  it('turns off again when the products module is configured without it', async () => {
    await productsSettings.configureSettings({ hideDrafts: true });
    await productsSettings.configureSettings({ slugify: (title) => title });
    assert.equal(productsSettings.hideDrafts, false);
  });
});

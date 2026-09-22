import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import type { ShopSettingsDocument } from '../settings-index.ts';

export const ShopSettingsCollection = async (db: mongodb.Db) => {
  const ShopSettings = db.collection<ShopSettingsDocument>('shop_settings');

  await buildDbIndexes<ShopSettingsDocument>(ShopSettings, [
    { index: { namespace: 1 }, options: { unique: true } },
  ]);

  return ShopSettings;
};

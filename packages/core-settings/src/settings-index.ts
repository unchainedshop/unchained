import type { TimestampFields } from '@unchainedshop/mongodb';

export type ShopSettingsDocument = {
  _id: string;
  namespace: string;
  value: Record<string, unknown>;
} & TimestampFields;

export * from './module/configureSettingsModule.ts';
export * from './db/ShopSettingsCollection.ts';
export * from './settings-registry.ts';

import { slugify as defaultSlugify } from '@unchainedshop/utils';

export interface ProductsSettings {
  slugify: (title: string) => string;
  // Single-product queries of the API (product, productCatalogPrices) return drafts and deleted
  // products only to callers who may list drafts. Off by default: anyone who knows the slug or id
  // can read a draft.
  hideDrafts: boolean;
  configureSettings: (options?: ProductsSettingsOptions) => void;
}

export type ProductsSettingsOptions = Omit<Partial<ProductsSettings>, 'configureSettings'>;

export const productsSettings: ProductsSettings = {
  slugify: defaultSlugify,
  hideDrafts: false,
  configureSettings: async ({ slugify, hideDrafts }: ProductsSettingsOptions = {}) => {
    productsSettings.slugify = slugify || defaultSlugify;
    productsSettings.hideDrafts = hideDrafts ?? false;
  },
};

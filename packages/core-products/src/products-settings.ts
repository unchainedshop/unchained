import { slugify as defaultSlugify } from '@unchainedshop/utils';

export interface ProductsSettingsOptions {
  slugify?: (title: string) => string;
  defaultTags?: string[];
}

export interface ProductsSettings {
  slugify?: (title: string) => string;
  configureSettings: (options?: ProductsSettingsOptions) => void;
  defaultTags?: string[];
}

export const productsSettings: ProductsSettings = {
  slugify: null,

  configureSettings: async ({ slugify = defaultSlugify, defaultTags }: ProductsSettingsOptions) => {
    productsSettings.slugify = slugify;
    productsSettings.defaultTags = (defaultTags ?? []).filter(Boolean);
  },
};

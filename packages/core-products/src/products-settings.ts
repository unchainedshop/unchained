import { slugify as defaultSlugify } from '@unchainedshop/utils';

export interface ProductsSettingsOptions {
  slugify?: (title: string) => string;
}

export interface ProductsSettings {
  slugify?: (title: string) => string;
  configureSettings: (options?: ProductsSettingsOptions) => void;
}

export const productsSettings: ProductsSettings = {
  slugify: null,

  configureSettings: async ({ slugify = defaultSlugify }: ProductsSettingsOptions) => {
    productsSettings.slugify = slugify;
  },
};

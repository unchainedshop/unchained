import { ProductsSettingsOptions } from '@unchainedshop/types/products.js';
import { slugify as defaultSlugify } from '@unchainedshop/utils';

export const productsSettings = {
  slugify: null,

  configureSettings: async ({ slugify = defaultSlugify }: ProductsSettingsOptions) => {
    productsSettings.slugify = slugify;
  },
};

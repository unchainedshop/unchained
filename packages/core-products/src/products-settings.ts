import { ProductsSettingsOptions } from '@unchainedshop/types/products';
import { slugify as defaultSlugify } from 'meteor/unchained:utils';

export const productsSettings = {
  slugify: null,

  configureSettings: async ({ slugify = defaultSlugify }: ProductsSettingsOptions) => {
    productsSettings.slugify = slugify;
  },
};

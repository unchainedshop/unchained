import { slugify as defaultSlugify } from '@unchainedshop/utils';

export interface ProductsSettings {
  slugify: (title: string) => string;
  configureSettings: (options?: ProductsSettingsOptions) => void;
}

export type ProductsSettingsOptions = Omit<Partial<ProductsSettings>, 'configureSettings'>;

export const productsSettings: ProductsSettings = {
  slugify: defaultSlugify,
  configureSettings: async ({ slugify }: ProductsSettingsOptions) => {
    productsSettings.slugify = slugify || defaultSlugify;
  },
};

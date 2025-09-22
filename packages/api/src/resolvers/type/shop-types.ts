import { Context } from '../../context.js';
import { Country } from '@unchainedshop/core-countries';
import { Language } from '@unchainedshop/core-languages';
import { checkAction } from '../../acl.js';
import { allRoles, actions } from '../../roles/index.js';

type HelperType<T> = (root: never, params: never, context: Context) => Promise<T>;
const { UNCHAINED_DEFAULT_PRODUCT_TAGS = 'featured,new,bestseller', UNCHAINED_DEFAULT_ASSORTMENT_TAGS } =
  process.env;

export interface ShopHelperTypes {
  _id: () => string;
  country: HelperType<Country>;
  language: HelperType<Language>;
  userRoles: HelperType<string[]>;
  productTags: HelperType<string[]>;
  assortmentTags: HelperType<string[]>;
}

export const Shop: ShopHelperTypes = {
  _id() {
    return 'root';
  },

  language: async (_root, _params, { locale, loaders }) => {
    return loaders.languageLoader.load({ isoCode: locale.language });
  },
  country: async (_root, _params, { countryCode, loaders }) => {
    return loaders.countryLoader.load({ isoCode: countryCode });
  },

  userRoles: async (_root, _params, context) => {
    await checkAction(context, (actions as any).manageUsers);
    return Object.values(allRoles)
      .map(({ name }) => name)
      .filter((name) => name.substring(0, 2) !== '__');
  },
  productTags: async (root, _, { modules, adminUiConfig }: Context) => {
    const existingProductTags = await modules.products.existingTags();
    const envTags = (UNCHAINED_DEFAULT_PRODUCT_TAGS || '')
      .split(',')
      .map((t) => t.trim()).filter(Boolean)
    const normalizedDefaultTags = envTags?.length ? envTags : (adminUiConfig?.defaultProductTags || []).filter(Boolean)
    const normalizedTags = Array.from(
      new Set(
        normalizedDefaultTags
          .concat(existingProductTags),
      ),
    );
    return normalizedTags;
  },
  assortmentTags: async (root, _, { modules, adminUiConfig }: Context) => {
    const existingAssortmentTags = await modules.assortments.existingTags();
    const envTags = (UNCHAINED_DEFAULT_ASSORTMENT_TAGS || '')
      .split(',')
      .map((t) => t.trim()).filter(Boolean)
    const normalizedDefaultTags = envTags?.length ? envTags : (adminUiConfig?.defaultAssortmentTags || []).filter(Boolean)
    const normalizedTags = Array.from(
      new Set(
        normalizedDefaultTags
          .concat(existingAssortmentTags),
      ),
    );
    return normalizedTags;
  },
};

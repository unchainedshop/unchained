import { Context } from '../../context.js';
import { Country } from '@unchainedshop/core-countries';
import { Language } from '@unchainedshop/core-languages';
import { checkAction } from '../../acl.js';
import { allRoles, actions } from '../../roles/index.js';

type HelperType<T> = (root: never, params: never, context: Context) => Promise<T>;
const { UNCHAINED_DEFAULT_PRODUCT_TAGS = 'featured,new,bestseller' } = process.env;

export interface ShopHelperTypes {
  _id: () => string;
  country: HelperType<Country>;
  language: HelperType<Language>;
  userRoles: HelperType<string[]>;
  tags: HelperType<string[]>;
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
  tags: async (root, _, { modules }: Context) => {
    const existingProductTags = await modules.products.existingTags();
    const normalizedTags = Array.from(
      new Set(
        (UNCHAINED_DEFAULT_PRODUCT_TAGS || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .concat(existingProductTags),
      ),
    );
    return normalizedTags;
  },
};

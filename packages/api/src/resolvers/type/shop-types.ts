import type { GraphQLFieldResolver } from 'graphql';
import type { Context } from '../../context.ts';
import type { Country } from '@unchainedshop/core-countries';
import type { Language } from '@unchainedshop/core-languages';
import { checkAction } from '../../roles/acl.ts';
import { actions, getPublicRoles } from '../../roles/index.ts';

type HelperType<T> = GraphQLFieldResolver<never, Context, never, Promise<T>>;
export interface ShopHelperTypes {
  _id: () => string;
  country: HelperType<Country>;
  language: HelperType<Language>;
  userRoles: HelperType<string[]>;
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

  userRoles: async (_root, _params, context, info) => {
    await checkAction(context, actions.manageUsers, [], info);
    return getPublicRoles(context.roles!);
  },
};

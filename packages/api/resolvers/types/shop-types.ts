import { Context } from '@unchainedshop/types/api';
import { Country } from '@unchainedshop/types/countries';
import { Language } from '@unchainedshop/types/languages';
import { checkAction } from '../../acl';
import { allRoles, actions } from '../../roles';

type HelperType<T> = (root: never, params: never, context: Context) => Promise<T>;

interface ShopHelperTypes {
  _id: () => string;
  country: HelperType<Country>;
  language: HelperType<Language>;
  userRoles: HelperType<Array<string>>;
}

export const Shop: ShopHelperTypes = {
  _id() {
    return 'root';
  },

  language: async (_root, _params, { localeContext, modules }) => {
    return modules.languages.findLanguage({ isoCode: localeContext.language });
  },
  country: async (_root, _params, { countryContext, modules }) => {
    return modules.countries.findCountry({ isoCode: countryContext });
  },

  userRoles: async (_root, _params, context) => {
    await checkAction(context, (actions as any).manageUsers);
    return Object.values(allRoles)
      .map(({ name }) => name)
      .filter((name) => name.substring(0, 2) !== '__');
  },
};

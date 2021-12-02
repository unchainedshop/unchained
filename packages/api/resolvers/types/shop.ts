import { Context } from '@unchainedshop/types/api';
import { Country } from '@unchainedshop/types/countries';
import { Language } from '@unchainedshop/types/languages';
import { checkAction } from '../../acl';
import roles, { actions } from '../../roles';

interface ShopHelperTypes {
  _id: () => string
  country: (root :never, params :never, context: Context) => Promise<Country>
  language: (root :never, params :never, context: Context) => Promise<Language>
  userRoles: (root :never, params :never, context: Context) => Array<string>
}

export const Shop: ShopHelperTypes = {
  _id() {
    return 'root';
  },

  async language(_root, _params, { localeContext, modules }) {
    return modules.languages.findLanguage({ isoCode: localeContext.language });
  },
  async country(_root, _params, { countryContext, modules }) {
    return modules.countries.findCountry({ isoCode: countryContext });
  },
  
  userRoles(_root, _params, context) {
    checkAction((actions as any).manageUsers, context.userId);
    return Object.values(roles)
      .map(({ name }) => name)
      .filter((name) => name.substring(0, 2) !== '__');
  },
};

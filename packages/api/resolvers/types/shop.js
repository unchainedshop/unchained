import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import { checkAction } from '../../acl';
import roles, { actions } from '../../roles';

export default {
  language(root, _, { localeContext }) {
    return Languages.findOne({ isoCode: localeContext.language });
  },
  country(root, _, { countryContext }) {
    return Countries.findOne({ isoCode: countryContext });
  },
  _id() {
    return 'root';
  },
  userRoles(root, params, context) {
    checkAction(actions.manageUsers, context.userId)
    return Object
      .values(roles)
      .map(({ name }) => name)
      .filter((name) => name.substring(0,2) !== '__');
  }
};

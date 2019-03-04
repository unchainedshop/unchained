import { Countries } from "meteor/unchained:core-countries";
import { Languages } from "meteor/unchained:core-languages";

export default {
  language(obj, _, { localeContext }) {
    return Languages.findOne({ isoCode: localeContext.language });
  },
  country(obj, _, { countryContext }) {
    return Countries.findOne({ isoCode: countryContext });
  },
  _id() {
    return "root";
  }
};

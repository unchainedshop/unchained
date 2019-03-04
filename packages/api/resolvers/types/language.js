import { log } from "meteor/unchained:core-logger";

export default {
  name(obj, { ignoreLocale = false }) {
    log(`ignoreLocale: ${ignoreLocale}`);
    return `${obj.isoCode}${obj.isBase ? " (Base)" : ""}`;
  }
};

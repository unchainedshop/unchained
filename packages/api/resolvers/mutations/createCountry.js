import { log } from "meteor/unchained:core-logger";
import { Countries } from "meteor/unchained:core-countries";

export default function(root, { country: inputData }, { userId }) {
  log("mutation createCountry", { userId });
  const { isoCode } = inputData;
  const country = { created: new Date() };
  country.authorId = userId;
  country.created = new Date();
  country.isoCode = isoCode.toUpperCase();
  country.isActive = true;
  const countryId = Countries.insert(country);
  const countryObject = Countries.findOne({ _id: countryId });
  return countryObject;
}

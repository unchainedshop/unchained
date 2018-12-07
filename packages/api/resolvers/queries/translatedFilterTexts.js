import { log } from 'meteor/unchained:core-logger';
import { FilterTexts } from 'meteor/unchained:core-filters';

export default function (root, { filterId, filterOptionValue }, { userId }) {
  log(`query translatedFilterTexts ${filterId} ${filterOptionValue}`, { userId });
  const selector = {
    filterId,
    filterOptionValue,
  };
  const productTexts = FilterTexts.find(selector).fetch();
  return productTexts;
}

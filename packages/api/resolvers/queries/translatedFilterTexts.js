import { log } from 'meteor/unchained:core-logger';
import { FilterTexts } from 'meteor/unchained:core-filters';

export default function translatedFilterTexts(
  root,
  { filterId, filterOptionValue },
  { userId }
) {
  log(`query translatedFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });

  const selector = {
    filterId,
    filterOptionValue,
  };
  return FilterTexts.find(selector).fetch();
}

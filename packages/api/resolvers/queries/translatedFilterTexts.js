import { log } from 'meteor/unchained:logger';
import { FilterTexts } from 'meteor/unchained:core-filters';

export default function translatedFilterTexts(
  root,
  { filterId, filterOptionValue },
  { userId }
) {
  log(`query translatedFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });
  return FilterTexts.findFilterTexts({ filterId, filterOptionValue });
}

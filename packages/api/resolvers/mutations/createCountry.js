import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function(root, { country }, { userId }) {
  log('mutation createCountry', { userId });
  return Countries.createCountry({
    ...country,
    authorId: userId
  });
}

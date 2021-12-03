import { log } from 'meteor/unchained:logger';
import { Countries } from 'meteor/unchained:core-countries';

export default function createCountry(root, { country }, { userId }) {
  log('mutation createCountry', { userId });
  return Countries.createCountry({
    ...country,
    authorId: userId,
  });
}

import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function(root, { limit, offset, includeInactive }, { userId }) {
  log(
    `query languages: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );
  const selector = {};
  if (!includeInactive) {
    selector.isActive = true;
  }
  const languages = Languages.find(selector, { skip: offset, limit }).fetch();
  return languages;
}

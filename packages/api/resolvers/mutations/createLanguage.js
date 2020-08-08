import { log } from 'meteor/unchained:core-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function (root, { language }, { userId }) {
  log('mutation createLanguage', { userId });
  return Languages.createLanguage({
    ...language,
    authorId: userId,
  });
}

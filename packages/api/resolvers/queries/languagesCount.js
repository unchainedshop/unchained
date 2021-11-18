import { log } from 'unchained-logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function languagesCount(root, { includeInactive }, { userId }) {
  log(`query languagesCount:  ${includeInactive ? 'includeInactive' : ''}`, {
    userId,
  });

  return Languages.count({
    includeInactive,
  });
}

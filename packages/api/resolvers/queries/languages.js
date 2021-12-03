import { log } from 'meteor/unchained:logger';
import { Languages } from 'meteor/unchained:core-languages';

export default function languages(
  root,
  { limit, offset, includeInactive },
  { userId }
) {
  log(
    `query languages: ${limit} ${offset} ${
      includeInactive ? 'includeInactive' : ''
    }`,
    { userId }
  );

  return Languages.findLanguages({
    limit,
    offset,
    includeInactive,
  });
}

import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

Users.rawCollection().createIndex({
  username: 'text',
  'emails.$.address': 'text',
  'profile.displayName': 'text',
  'lastBillingAddress.firstName': 'text',
  'lastBillingAddress.lastName': 'text',
  'lastBillingAddress.company': 'text',
  'lastBillingAddress.addressLine': 'text',
  'lastBillingAddress.addressLine2': 'text',
});

export default function users(
  root,
  { limit, offset, includeGuests, queryString },
  { userId },
) {
  log(
    `query users ${limit} ${offset} ${includeGuests ? 'includeGuests' : ''}`,
    { userId },
  );

  if (queryString) {
    return Users.find(
      { $text: { $search: queryString } },
      { skip: offset, limit },
    );
  }

  const selector = {};
  if (!includeGuests) {
    selector.guest = { $ne: true };
  }

  return Users.find(selector, { skip: offset, limit }).fetch();
}

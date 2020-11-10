import { log } from 'meteor/unchained:core-logger';
import { Users } from 'meteor/unchained:core-users';

export default async function users(
  root,
  { limit, offset, includeGuests, queryString },
  { userId }
) {
  log(
    `query users ${limit} ${offset} ${queryString} ${
      includeGuests ? 'includeGuests' : ''
    }`,
    { userId }
  );

  const selector = {};
  if (!includeGuests) {
    selector.guest = { $ne: true };
  }
  if (queryString) {
    const userArray = await Users.rawCollection()
      .find(
        { ...selector, $text: { $search: queryString } },
        {
          skip: offset,
          limit,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }
      )
      .toArray();
    return (userArray || []).map((item) => new Users._transform(item)); // eslint-disable-line
  }

  return Users.find(selector, { skip: offset, limit }).fetch();
}

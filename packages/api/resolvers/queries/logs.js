import { Logs } from 'meteor/unchained:core-logger';

// we don't log this query because of reasons ;)
export default function(root, { limit, offset }, { userId }) {
  console.log(`special query logs: ${limit} ${offset} ${userId}`); // eslint-disable-line
  const selector = {};
  const logs = Logs.find(selector, {
    skip: offset,
    limit,
    sort: {
      created: -1
    }
  }).fetch();
  return logs;
}

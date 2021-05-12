import { Logs } from 'meteor/unchained:core-logger';

// we don't log this query because of reasons ;)
export default function logs(root, { limit, offset }) {
  return Logs.findLogs({ limit, offset });
}

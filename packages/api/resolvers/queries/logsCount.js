import { Logs } from 'meteor/unchained:core-logger';

// we don't log this query because of reasons ;)
export default function logsCount() {
  return Logs.count();
}

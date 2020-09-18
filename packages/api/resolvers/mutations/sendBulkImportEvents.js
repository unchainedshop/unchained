import { log } from 'meteor/unchained:core-logger';

export default function sendBulkImportEvents(root, { events }, { userId }) {
  log(`mutation sendBulkImportEvents ${events.length} Events`, { userId });
}

import { log } from 'unchained-logger';
import { WorkStatus } from './schema';
import { WorkQueue } from './collections';

export const getWorkStatus = (work) => {
  if (work.deleted) {
    return WorkStatus.DELETED;
  }
  if (!work.started && !work.finished) {
    return WorkStatus.NEW;
  }
  if (work.started && !work.finished) {
    return WorkStatus.ALLOCATED;
  }
  if (work.started && work.finished && work.success) {
    return WorkStatus.SUCCESS;
  }
  if (work.started && work.finished && !work.success) {
    return WorkStatus.FAILED;
  }

  log('Unexpected work status', { level: 'warn' });
  throw new Error('Unexpected work status');
};

WorkQueue.helpers({
  status() {
    return getWorkStatus(this);
  },
  async original() {
    return WorkQueue.findOne({ _id: this.originalWorkId });
  },
});

export default () => {};

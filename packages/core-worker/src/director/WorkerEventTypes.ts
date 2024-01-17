export enum WorkerEventTypes {
  ADDED = 'WORK_ADDED',
  ALLOCATED = 'WORK_ALLOCATED',
  DONE = 'WORK_DONE',
  FINISHED = 'WORK_FINISHED',
  DELETED = 'WORK_DELETED',
  RESCHEDULED = 'WORK_RESCHEDULED',
}

// The difference between `done` and `finished` is, that work is `done` after
// it was computed (no DB write, could be external) and `finished` after
// the changes are written to the DB

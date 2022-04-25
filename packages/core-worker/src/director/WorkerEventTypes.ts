export enum WorkerEventTypes {
  ADDED = 'added',
  ALLOCATED = 'allocated',
  DONE = 'done',
  FINISHED = 'finished',
  DELETED = 'deleted',
  RESCHEDULED = 'rescheduled',
}
// The difference between `done` and `finished` is, that work is `done` after
// it was computed (no DB write, could be external) and `finished` after
// the changes are written to the DB

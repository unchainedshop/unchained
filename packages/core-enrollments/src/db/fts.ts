import { createFTS } from '@unchainedshop/store';

/**
 * FTS5 full-text search for enrollments.
 * Indexes: _id, userId, enrollmentNumber, status
 */
const enrollmentsFTS = createFTS({
  ftsTable: 'enrollments_fts',
  sourceTable: 'enrollments',
  columns: ['_id', 'userId', 'enrollmentNumber', 'status'],
});

export const setupEnrollmentsFTS = enrollmentsFTS.setup;
export const searchEnrollmentsFTS = enrollmentsFTS.search;

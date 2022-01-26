import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';
import { Enrollment } from '@unchainedshop/types/enrollments';

export const EnrollmentsCollection = async (db: Db) => {
  const Enrollments = db.collection<Enrollment>('enrollments');

  // Enrollment Indexes
  await buildDbIndexes<Enrollment>(Enrollments, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
  ]);

  return Enrollments;
};

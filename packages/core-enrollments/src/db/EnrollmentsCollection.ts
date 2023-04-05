import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Enrollment } from '@unchainedshop/types/enrollments.js';

export const EnrollmentsCollection = async (db: mongodb.Db) => {
  const Enrollments = db.collection<Enrollment>('enrollments');

  // Enrollment Indexes
  await buildDbIndexes<Enrollment>(Enrollments, [
    { index: { userId: 1 } },
    { index: { productId: 1 } },
    { index: { status: 1 } },
    { index: { enrollmentNumber: 1 } },
    {
      index: {
        _id: 'text',
        userId: 'text',
        enrollmentNumber: 'text',
        status: 'text',
        'contact.telNumber': 'text',
        'contact.emailAddress': 'text',
      } as any,
      options: {
        weights: {
          _id: 8,
          userId: 3,
          enrollmentNumber: 6,
          'contact.telNumber': 5,
          'contact.emailAddress': 4,
          status: 1,
        },
        name: 'enrollment_fulltext_search',
      },
    },
  ]);

  return Enrollments;
};

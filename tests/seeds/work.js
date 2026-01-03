export const NewWork = {
  _id: 'simple-work',
  type: 'EXTERNAL',
  created: new Date(),
  scheduled: new Date('2030/10/01'),
  priority: 100,
  retries: 3,
  status: 'NEW',
  worker: 'TEST-GRAPHQL',
};

export const AllocatedWork = {
  ...NewWork,
  scheduled: new Date('2030/11/01'),
  status: 'ALLOCATED',
  _id: 'allocated-work',
};

export default async function seedWorkQueue(db) {
  await db.collection('work_queue').findOrInsertOne(NewWork);
  await db.collection('work_queue').findOrInsertOne(AllocatedWork);
}

/**
 * Seed work queue into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid side effects.
 */
export async function seedWorkQueueToDrizzle(db) {
  const { workQueue } = await import('@unchainedshop/core-worker');

  // Delete all existing work queue entries directly
  await db.delete(workQueue);

  // Insert NewWork (NEW status - no started/finished)
  await db.insert(workQueue).values({
    _id: NewWork._id,
    type: NewWork.type,
    created: NewWork.created,
    scheduled: NewWork.scheduled,
    priority: NewWork.priority,
    retries: NewWork.retries,
    worker: NewWork.worker,
    input: {},
  });

  // Insert AllocatedWork (ALLOCATED status - started but no finished)
  await db.insert(workQueue).values({
    _id: AllocatedWork._id,
    type: AllocatedWork.type,
    created: AllocatedWork.created || new Date(),
    scheduled: AllocatedWork.scheduled,
    priority: AllocatedWork.priority,
    retries: AllocatedWork.retries,
    worker: AllocatedWork.worker,
    started: new Date(), // Mark as allocated (started)
    input: {},
  });
}

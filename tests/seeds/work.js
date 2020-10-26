export const SimpleWork = {
  _id: 'simple-work',
  type: 'EXTERNAL',
  created: new Date().getTime(),
  scheduled: new Date('2030/10/01').getTime(),
  priority: 100,
  retries: 3,
};

export const AnotherWork = {
  ...SimpleWork,
  scheduled: new Date('2030/11/01').getTime(),
  _id: 'another-work',
};

export default async function seedWorkQueue(db) {
  await db.collection('work_queue').findOrInsertOne(SimpleWork);
  await db.collection('work_queue').findOrInsertOne(AnotherWork);
}

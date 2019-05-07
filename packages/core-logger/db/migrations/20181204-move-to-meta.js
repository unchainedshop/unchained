import { Migrations } from 'meteor/percolate:migrations';
import { Logs } from '../collections';

Migrations.add({
  version: 20181204,
  name: 'Move orderId and userId into meta field',
  up() {
    Logs.find({
      $or: [{ orderId: { $exists: true } }, { userId: { $exists: true } }]
    })
      .fetch()
      .forEach(({ _id, userId, orderId }) => {
        Logs.update(
          { _id },
          {
            $set: {
              meta: { orderId, userId }
            },
            $unset: {
              orderId: 1,
              userId: 1
            }
          }
        );
      });
  },
  down() {
    Logs.find({
      $or: [
        { 'meta.orderId': { $exists: true } },
        { 'meta.userId': { $exists: true } }
      ]
    })
      .fetch()
      .forEach(({ _id, userId, orderId }) => {
        Logs.update(
          { _id },
          {
            $set: {
              orderId,
              userId
            },
            $unset: {
              'meta.orderId': 1,
              'meta.userId': 1
            }
          }
        );
      });
  }
});

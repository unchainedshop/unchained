import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';
import { MediaObjects } from '../db/collections';

useMiddlewareWithCurrentContext(
  '/graphql/minio/',
  bodyParser.json({
    strict: false,
  })
);

useMiddlewareWithCurrentContext('/graphql/minio/', async (req, res) => {
  if (req.method === 'POST' && req.body) {
    const { Records = [], Key, EventName } = req.body;
    if (EventName === 's3:ObjectCreated:Put') {
      const [{ responseElements, s3 }] = Records;
      const { object } = s3;
      const { size, contentType: type } = object;
      const currentId = object.key.split('.')[0];

      MediaObjects.update(
        { _id: currentId },
        {
          $set: {
            size,
            type,
            updated: new Date(),
          },
        }
      );
    }
  }
});

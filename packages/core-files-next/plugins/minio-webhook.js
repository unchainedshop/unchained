import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';
import { linkMedia } from './minio';

useMiddlewareWithCurrentContext(
  '/graphql/minio/',
  bodyParser.json({
    strict: false,
  })
);

useMiddlewareWithCurrentContext('/graphql/minio/', async (req) => {
  if (req.method === 'POST' && req.body) {
    const { Records = [], EventName } = req.body;
    if (EventName === 's3:ObjectCreated:Put') {
      const [{ s3 }] = Records;
      const { object } = s3;
      const { size, contentType: type } = object;
      const [currentId] = object.key.split('.');
      linkMedia({ mediaUploadTicketId: currentId, type, size });
    }
  }
});

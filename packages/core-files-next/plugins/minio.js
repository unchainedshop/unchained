import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { ProductMediaObject } from 'meteor/unchained:core-products';
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
      const [
        {
          responseElements,
          requestParameters,
          s3,
          source,
          eventSource,
          eventTime,
          eventName,
          userIdentity,
        },
      ] = Records;
      const { bucket, object } = s3;
      const { size, contentType: type } = object;
      const currentId = object.key.split('.')[0];

      const uploadedImageUrl = `${responseElements['x-minio-origin-endpoint']}/${Key}`;
      MediaObjects.update(
        { _id: currentId },
        {
          $set: {
            url: uploadedImageUrl,
            size,
            type,
            updated: new Date(),
          },
        }
      );

      console.log('s3.object', object);
      console.log('bucket', bucket);
      console.log('userIdentity', userIdentity);
      console.log('imageUrl', uploadedImageUrl);
      console.log('eventSource', eventSource);
      console.log('eventTime', eventTime);
      console.log('eventName', eventName);
      console.log('requestParameters', requestParameters);
      console.log('responseElements', responseElements);
      console.log('s3', s3);
      console.log('source', source);
    }
  }
  console.log(req.body);
});

import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import { ProductMediaObject } from 'meteor/unchained:core-products';
import bodyParser from 'body-parser';

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
      const currentId = object.key.split('.')[0];

      const uploadedImageUrl = `${responseElements['x-minio-origin-endpoint']}/${Key}`;
      ProductMediaObject.update(
        { _id: currentId },
        {
          $set: {
            url: uploadedImageUrl,
            updated: new Date(),
          },
        }
      );

      const file = ProductMediaObject.findOne({
        _id: currentId,
      });
      console.log(file);

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

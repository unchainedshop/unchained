import Minio from 'minio';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';

import { ObjectsCollection } from '../db';

const client = new Minio.Client({
  endPoint: '172.18.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'G1OSU5GDTK5BVHJ4TOTV',
  secretKey: '4sTd+rInIhWjUI6H7KLL8mTtIJUBXk+wBy6LvrBE',
  cacheControl: 'max-age=31536000',
});

const imageType = 'image/jpg';

useMiddlewareWithCurrentContext(
  '/minio/',
  bodyParser.json({
    strict: false,
  })
);

useMiddlewareWithCurrentContext('/minio/', async (req, res) => {
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
        },
      ] = Records;
      const uploadedImageUrl = `${responseElements['x-minio-origin-endpoint']}/${Key}`;
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

export default client;

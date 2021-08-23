import Minio from 'minio';
import { ObjectsCollection } from './db';

const client = new Minio.Client({
  endPoint: '172.18.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'G1OSU5GDTK5BVHJ4TOTV',
  secretKey: '4sTd+rInIhWjUI6H7KLL8mTtIJUBXk+wBy6LvrBE',
});

export const createSignedPutURL = async (fileNmae, context = null) => {
  const expires = 24 * 60 * 60;
  const putURL = await client.presignedPutObject(
    'firstbucket',
    fileNmae,
    24 * 60 * 60
  );

  const _id = ObjectsCollection.insert({
    putURL,
    expires,
    created: new Date(),
  });
  return {
    _id,
    putURL,
    expires,
  };
};

export default client;

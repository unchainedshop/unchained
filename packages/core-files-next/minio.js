import Minio from 'minio';
import { ObjectsCollection } from './db';

const client = new Minio.Client({
  endPoint: 'play.min.io',
  port: 9000,
  useSSL: true,
  accessKey: 'Q3AM3UQ867SPQQA43P2F',
  secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
});

export const createSignedPutURL = async (fileNmae, context = null) => {
  const expires = 24 * 60 * 60;
  const putURL = await client.presignedPutObject(
    'uploads',
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

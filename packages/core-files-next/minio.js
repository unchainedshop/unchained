import Minio from 'minio';
import { ObjectsCollection } from './db';

const client = new Minio.Client({
  endPoint: '172.18.0.1',
  port: 9000,
  useSSL: false,
  accessKey: 'FLMPN8BD8X6NMIVFIFTK',
  secretKey: 'vbVbzP84C5BRLLMvZPMhsDg4RMZidfStjj+BYgY8',
});

export const createSignedPutURL = async (fileNmae, context = null) => {
  const expires = 24 * 60 * 60;
  const putURL = await client.presignedPutObject(
    'fileupload',
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

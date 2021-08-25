import Minio from 'minio';
import crypto from 'crypto';
import { MediaObjects } from './db';

const PUT_URL_EXPIRY = 24 * 60 * 60;

const client = new Minio.Client({
  endPoint: '172.18.0.1',
  port: 9000,
  useSSL: false,
  accessKey: '8H3FOTEB3W62ATGT3V32',
  secretKey: 'AIMx5wmsWG9WUpE3WN6qe9SL4oIRklHhtG3yYn+V',
});

export const createSignedPutURL = async (fileName, { userId, ...context }) => {
  const random = crypto.randomBytes(16);
  const hash = crypto
    .createHash('sha256')
    .update([this._id, fileName, userId, random, PUT_URL_EXPIRY].join(''))
    .digest('hex');
  const extension = fileName.substr(fileName.lastIndexOf('.'));
  const hashedName = hash + extension;
  console.log('hashedName', hashedName);
  const putURL = await client.presignedPutObject(
    'firstbucket',
    hashedName,
    PUT_URL_EXPIRY
  );
  console.log('putURL', putURL);

  const _id = MediaObjects.insert({
    _id: hash,
    putURL,
    name: fileName,
    expires: PUT_URL_EXPIRY,
    created: new Date(),
  });

  return {
    _id,
    putURL,
    expires: PUT_URL_EXPIRY,
  };
};

export default client;

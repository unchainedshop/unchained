import Minio from 'minio';
import crypto from 'crypto';
import { MediaObjects } from './db';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_BUCKET_NAME,
} = process.env;

const PUT_URL_EXPIRY = 24 * 60 * 60;

const client = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: parseInt(MINIO_PORT, 10),
  useSSL: false,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

if (!client.bucketExists(MINIO_BUCKET_NAME)) {
  client.makeBucket(MINIO_BUCKET_NAME);
}

export const createSignedPutURL = async (fileName, { userId, ...context }) => {
  const random = crypto.randomBytes(16);
  const hash = crypto
    .createHash('sha256')
    .update([this._id, fileName, userId, random, PUT_URL_EXPIRY].join(''))
    .digest('hex');
  const extension = fileName.substr(fileName.lastIndexOf('.'));
  const hashedName = hash + extension;

  const putURL = await client.presignedPutObject(
    MINIO_BUCKET_NAME,
    hashedName,
    PUT_URL_EXPIRY
  );

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

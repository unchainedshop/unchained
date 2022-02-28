import { IFileAdapter } from '@unchainedshop/types/files';
import { FileAdapter, FileDirector } from 'meteor/unchained:file-upload';
import crypto from 'crypto';
import https from 'https';
import { log, LogLevel } from 'meteor/unchained:logger';
import mimeType from 'mime-types';
import Minio from 'minio';
import { Readable } from 'stream';
import { URL } from 'url';

const { MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_ENDPOINT, MINIO_BUCKET_NAME, NODE_ENV } = process.env;
const PUT_URL_EXPIRY = 24 * 60 * 60;

const hash = (fileName: string) => {
  return crypto.createHash('sha256').update(fileName).digest('hex');
};

const connectToMinio = () => {
  if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_ENDPOINT) {
    log(
      'Please configure Minio/S3 by providing MINIO_ACCESS_KEY,MINIO_SECRET_KEY & MINIO_ENDPOINT to use upload features',
      { level: LogLevel.Error },
    );
    return null;
  }

  try {
    const resolvedUrl = new URL(MINIO_ENDPOINT);
    return new Minio.Client({
      endPoint: resolvedUrl.hostname,
      useSSL: resolvedUrl.protocol === 'https:',
      port: parseInt(resolvedUrl.port, 10) || undefined,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });
  } catch (error) {
    log('Exception while creating Minio client', { level: LogLevel.Error, ...error });
    return null;
  }
};

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${hashedFilename}`;
};

const getMimeType = (extension) => {
  return mimeType.lookup(extension);
};

const client: Minio.Client = connectToMinio();
/* @ts-ignore */
if (NODE_ENV === 'development') client?.traceOn(process.stdout);

const downloadFromUrlToBuffer = async (fileUrl: string) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const req = https.get(fileUrl, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`statusCode=${res.statusCode}`));
      }

      const body: any = [];
      let buffer;
      res.on('data', (chunk) => {
        body.push(chunk);
      });
      res.on('end', () => {
        try {
          buffer = Buffer.concat(body);
        } catch (e) {
          reject(e);
        }
        resolve(Buffer.from(buffer, 'base64'));
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
};

const getObjectStats = async (fileName: string) => {
  if (!client) throw new Error('Minio not connected, check env variables');

  return client.statObject(MINIO_BUCKET_NAME, fileName);
};

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

const getExpiryDate = () => new Date(new Date().getTime() + PUT_URL_EXPIRY);

export const MinioAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.minio',
  label: 'Uploads files into an S3 bucket using minio',
  version: '1.0',

  ...FileAdapter,

  async createSignedURL(directoryName = '', fileName) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const expiryDate = getExpiryDate();
    const [, ...ext] = fileName.split('.');
    const _id = `${hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`)}.${ext.join('.')}`;

    const url = await client.presignedPutObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${_id}`,
      PUT_URL_EXPIRY,
    );

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      type: getMimeType(fileName),
      putURL: url,
      url: generateMinioUrl(directoryName, _id),
    };
  },

  async removeFiles(files) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const fileIds = files.map(({ path, _id }) => {
      return `${path}/${_id}`;
    });

    await client.removeObjects(MINIO_BUCKET_NAME, fileIds);
  },

  async uploadFileFromStream(directoryName: string, rawFile: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

    let stream;
    let fileName;
    if (rawFile instanceof Promise) {
      const { filename: fname, createReadStream } = await rawFile;
      fileName = fname;
      stream = createReadStream();
    } else {
      fileName = rawFile.filename;
      stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
    }

    const expiryDate = getExpiryDate();
    const _id = hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`);

    await client.putObject(MINIO_BUCKET_NAME, `${directoryName}/${_id}`, stream);

    const { size } = await getObjectStats(`${directoryName}/${_id}`);
    const type = getMimeType(fileName);

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, _id),
    };
  },

  async uploadFileFromURL(directoryName: string, { fileLink, fileName: fname }: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const { href } = new URL(fileLink);
    const fileName = fname || href.split('/').pop();
    const expiryDate = getExpiryDate();
    const _id = hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`);

    const buff = await downloadFromUrlToBuffer(fileLink);
    const stream = bufferToStream(buff);
    await client.putObject(MINIO_BUCKET_NAME, `${directoryName}/${_id}`, stream);
    const { size } = await getObjectStats(`${directoryName}/${_id}`);
    const type = getMimeType(fileName);

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, _id),
    };
  },
};

FileDirector.registerAdapter(MinioAdapter);

import { IFileAdapter } from '@unchainedshop/types/files';
import { FileAdapter, FileDirector } from '@unchainedshop/file-upload';

import https from 'https';
import http, { OutgoingHttpHeaders } from 'http';
import { log, LogLevel } from '@unchainedshop/logger';
import mimeType from 'mime-types';
import Minio from 'minio';
import { Readable } from 'stream';
import { URL } from 'url';
import buildHashedFilename from '@unchainedshop/file-upload/buildHashedFilename';

const {
  MINIO_ACCESS_KEY,
  MINIO_REGION,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
  AMAZON_S3_SESSION_TOKEN,
} = process.env;
const PUT_URL_EXPIRY = 24 * 60 * 60;

let client: Minio.Client;

export async function connectToMinio(credentialsProvider) {
  if (!MINIO_ENDPOINT || !MINIO_BUCKET_NAME) {
    log(
      'Please configure Minio/S3 by providing MINIO_ENDPOINT & MINIO_BUCKET_NAME to use upload features',
      { level: LogLevel.Error },
    );
    return null;
  }

  try {
    const resolvedUrl = new URL(MINIO_ENDPOINT);
    const minioClient = new Minio.Client({
      endPoint: resolvedUrl.hostname,
      useSSL: resolvedUrl.protocol === 'https:',
      port: parseInt(resolvedUrl.port, 10) || undefined,
      region: MINIO_REGION,
      sessionToken: AMAZON_S3_SESSION_TOKEN,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    if (NODE_ENV === 'development') minioClient?.traceOn(process.stdout);

    if (credentialsProvider) {
      await minioClient.setCredentialsProvider(credentialsProvider);
    }

    client = minioClient;
  } catch (error) {
    log(`Exception while creating Minio client: ${error.message}`, {
      level: LogLevel.Error,
    });
  }
  return null;
}

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${hashedFilename}`;
};

const getMimeType = (extension) => {
  return mimeType.lookup(extension);
};

connectToMinio().then((c) => {
  client = c;
});

const createDownloadStream = (
  fileUrl: string,
  headers: OutgoingHttpHeaders,
): Promise<http.IncomingMessage> => {
  const { href, protocol } = new URL(fileUrl);
  return new Promise((resolve, reject) => {
    try {
      if (protocol === 'http:') {
        http.get(href, { headers }, resolve);
      } else {
        https.get(href, { headers }, resolve);
      }
    } catch (e) {
      reject(e);
    }
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

  async createSignedURL(directoryName, fileName) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const expiryDate = getExpiryDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

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

    const _id = buildHashedFilename(directoryName, fileName, new Date());
    const type = rawFile?.mimetype || getMimeType(fileName);

    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(MINIO_BUCKET_NAME, `${directoryName}/${_id}`, stream, undefined, metaData);

    const { size } = await getObjectStats(`${directoryName}/${_id}`);

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, _id),
    };
  },

  async uploadFileFromURL(directoryName: string, { fileLink, fileName: fname, headers }: any) {
    if (!client) throw new Error('Minio not connected, check env variables');

    const { href } = new URL(fileLink);
    const fileName = fname || href.split('/').pop();
    const _id = buildHashedFilename(directoryName, fileName, new Date());

    const stream = await createDownloadStream(fileLink, headers);
    const type = stream?.headers?.['content-type'] || getMimeType(fileName);

    const metaData = {
      'Content-Type': type,
    };

    await client.putObject(MINIO_BUCKET_NAME, `${directoryName}/${_id}`, stream, undefined, metaData);
    const { size } = await getObjectStats(`${directoryName}/${_id}`);

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size,
      type,
      url: generateMinioUrl(directoryName, _id),
    };
  },
};

FileDirector.registerAdapter(MinioAdapter);

export default MinioAdapter;

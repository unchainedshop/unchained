import { File, IFileAdapter } from '@unchainedshop/types/files';
import { FileAdapter } from 'meteor/unchained:core-files';
import { log, LogLevel } from 'meteor/unchained:logger';
import Minio from 'minio';
import crypto from 'crypto';
import { Readable } from 'stream';
import https from 'https';
import mimeType from 'mime-types';
import { URL } from 'url';
import { Context } from '@unchainedshop/types/api';

const {
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_ENDPOINT,
  MINIO_BUCKET_NAME,
  NODE_ENV,
} = process.env;
const PUT_URL_EXPIRY = 24 * 60 * 60;

const UploadContainerRegistry = new Map<string, (params: any) => Promise<any>>()

const connectToMinio = () => {
  if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_ENDPOINT) {
    log(
      'Please configure Minio/S3 by providing MINIO_ACCESS_KEY,MINIO_SECRET_KEY & MINIO_ENDPOINT to use upload features',
      { level: LogLevel.Error }
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
  } catch (e) {
    console.error(e);
    return null;
  }
};

const generateMinioUrl = (directoryName: string, hashedFilename: string) => {
  return `${MINIO_ENDPOINT}/${MINIO_BUCKET_NAME}/${directoryName}/${hashedFilename}`;
};

// Returns the file name with extension from its ID and url bucket name is included in the ID on insert operation
const composeObjectName = (file: File) => {
  return decodeURIComponent(file.externalFileId).concat(
    file.url ? file.url.substr(file.url.lastIndexOf('.')) : ''
  );
};

const getMimeType = (extension) => {
  return mimeType.lookup(extension);
};

export class MinioAdapter extends FileAdapter implements IFileAdapter {
  private client: Minio.Client;

  constructor(context: Context) {
    super(context);
    this.client = connectToMinio();
    // if (NODE_ENV === 'development') this.client?.traceOn(process.stdout);
  }

  async removeFiles(fileIds) {
    return true;
  }

  async uploadObjectStream(directoryName: string, rawFile: any) {
    if (!this.client)
      throw new Error('Minio not connected, check env variables');

    let stream;
    let fname;
    if (rawFile instanceof Promise) {
      const { filename, createReadStream } = await rawFile;
      fname = filename;
      stream = createReadStream();
    } else {
      fname = rawFile.filename;
      stream = this.bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
    }

    const { hash, hashedName } = this.generateRandomFileName(fname);

    await this.client.putObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${hashedName}`,
      stream
    );

    const { size } = await this.getObjectStats(
      `${directoryName}/${hashedName}`
    );
    const type = getMimeType(fname);

    return {
      fileName: fname,
      hash,
      hashedName,
      size,
      type,
    };
  }

  async uploadFileFromURL(directoryName, { fileLink, fileName }) {
    if (!this.client)
      throw new Error('Minio not connected, check env variables');

    const { href } = new URL(fileLink);
    const filename = fileName || href.split('/').pop();
    const { hash, hashedName } = this.generateRandomFileName(filename);

    const buff = await this.downloadFromUrlToBuffer(fileLink);
    const stream = this.bufferToStream(buff);
    await this.client.putObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${hashedName}`,
      stream
    );
    const { size } = await this.getObjectStats(
      `${directoryName}/${hashedName}`
    );
    const type = getMimeType(filename);

    return {
      fileName: filename,
      hash,
      hashedName,
      size,
      type,
    };
  }

  registerUploadContainer(
    directoryName: string,
    fn: (params: any) => Promise<any>
  ) {
    if (!UploadContainerRegistry.has(directoryName)) {
      UploadContainerRegistry.set(directoryName, fn);
    }

    return {
      createSignedURL: async (fileName: string) => {
        const result = await this.createSignedPutURL(directoryName, fileName);
        return result;
      },
    };
  }

  async createSignedPutURL(directoryName = '', fileName: string) {
    if (!this.client)
      throw new Error('Minio not connected, check env variables');

    const { hash, hashedName } = this.generateRandomFileName(fileName);

    const putURL = await this.client.presignedPutObject(
      MINIO_BUCKET_NAME,
      `${directoryName}/${hashedName}`,
      PUT_URL_EXPIRY
    );

    return { putURL, hash, hashedName };
  }

  downloadFromUrlToBuffer(fileUrl: string): Promise<Buffer> {
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
  }

  generateRandomFileName(fileName: string) {
    const random = crypto.randomBytes(16);
    const hash = crypto
      .createHash('sha256')
      .update([fileName, random].join(''))
      .digest('hex');
    const extension = fileName.substr(fileName.lastIndexOf('.'));
    const hashedName = hash + extension;
    return {
      hash,
      hashedName,
    };
  }

  async getObjectStats(fileName: string) {
    if (!this.client)
      throw new Error('Minio not connected, check env variables');

    return await this.client.statObject(MINIO_BUCKET_NAME, fileName);
  }

  bufferToStream(buffer: any) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    return stream;
  }
}

import fs from 'fs';
import util from 'util';
import { resolve } from 'path';
import { createLogger } from '@unchainedshop/logger';

const readFile = util.promisify(fs.readFile);

const { DATATRANS_API_MOCKS_PATH } = process.env;

const logger = createLogger('unchained:datatrans');

export default (
  endpoint: string,
  merchantId: string,
  secret: string,
): ((path: string, body: unknown) => Promise<Response>) => {
  if (DATATRANS_API_MOCKS_PATH) {
    return async (path): Promise<Response> => {
      try {
        const filePath = resolve(process.env.PWD, DATATRANS_API_MOCKS_PATH, `.${path}.json`);
        const content = await readFile(filePath);
        const json = JSON.parse(content.toString());
        return {
          json: async () => json,
          status: json?.error ? 500 : 204,
        } as any;
      } catch (error) {
        logger.error('Mock: Error while trying reading and parsing file', {
          ...error,
        });
        return {
          json: async () => ({ error: { code: 'MOCK', message: 'MOCK' } }),
          status: 500,
        } as any;
      }
    };
  }

  const token = `${merchantId}:${secret}`;

  return async (path: string, body: any): Promise<Response> => {
    logger.debug(`Fetch ${endpoint}${path}: ${JSON.stringify(body)}`);
    return fetch(`${endpoint}${path}`, {
      method: body ? 'POST' : 'GET',
      body: body ? JSON.stringify(body) : undefined,
      // eslint-disable-next-line
      // @ts-ignore
      duplex: body ? 'half' : undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(token, 'utf-8').toString('base64')}`,
      },
    });
  };
};

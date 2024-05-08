/// <reference lib="dom" />
import fs from 'fs';
import util from 'util';
import { resolve } from 'path';
import { createLogger } from '@unchainedshop/logger';

const readFile = util.promisify(fs.readFile);

const { PAYREXX_API_MOCKS_PATH } = process.env;

const logger = createLogger('unchained:payrexx');

export default (
  baseUrl: string = 'https://api.payrexx.com/v1.0/',
  instance: string = null,
  secret: string = null,
): ((path: string, method: 'GET' | 'DELETE' | 'PUT' | 'POST', data?: any) => Promise<Response>) => {
  if (PAYREXX_API_MOCKS_PATH) {
    return async (path): Promise<Response> => {
      try {
        const filePath = resolve(process.env.PWD, PAYREXX_API_MOCKS_PATH, `${path}.json`);
        const content = await readFile(filePath);
        const textData = content.toString();
        const jsonData = JSON.parse(textData);
        return {
          json: async () => jsonData,
          text: async () => textData,
          ok: !jsonData?.error,
          status: jsonData?.error ? 500 : 204,
        } as any;
      } catch (error) {
        logger.error('Mock: Error while trying reading and parsing file', {
          ...error,
        });
        return {
          json: async () => ({ error: { code: 'MOCK', message: 'MOCK' } }),
          text: async () => 'MOCK',
          ok: false,
          status: 500,
        } as any;
      }
    };
  }

  const buildSignature = async (query = '') => {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(query));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  };

  const buildUrl = (path, params = {}) => {
    const url = new URL(`${path}/`, baseUrl);
    url.search = new URLSearchParams({ instance, ...params }).toString();
    return url.href;
  };

  return async (path: string, method: 'GET' | 'DELETE' | 'POST', data?: any): Promise<Response> => {
    logger.verbose(`${method} ${path}`);
    if (method === 'POST') {
      const queryParams = { ...data };
      const signature = await buildSignature(new URLSearchParams(queryParams).toString());
      queryParams.ApiSignature = signature;
      const url = buildUrl(path);
      return fetch(url, {
        method,
        body: new URLSearchParams(queryParams).toString(),
        headers: {
          accept: 'application/json',
          'content-type': 'application/x-www-form-urlencoded',
        },
      });
    }
    if (method === 'DELETE' || method === 'GET') {
      const url = buildUrl(path, { ApiSignature: await buildSignature() });
      return fetch(url, {
        method,
      });
    }
    throw new Error('Method not supported');
  };
};

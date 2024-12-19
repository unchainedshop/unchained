import { createLogger } from '@unchainedshop/logger';
const { MOCK_APIS } = process.env;

const logger = createLogger('unchained:datatrans');

export default (
  endpoint: string,
  merchantId: string,
  secret: string,
): ((path: string, body: unknown) => Promise<Response>) => {
  if (MOCK_APIS) {
    return async (path): Promise<Response> => {
      try {
        const { default: json } = await import(
          `${import.meta.dirname}/../../../../tests/mock/datatrans/${path}.json`,
          {
            with: { type: 'json' },
          }
        );
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

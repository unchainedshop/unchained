/// <reference lib="dom" />
import { IWorkerAdapter } from '@unchainedshop/types/worker.js';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { log, LogLevel } from '@unchainedshop/logger';

const postFetch = async (url, { data, headers }) => {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    // eslint-disable-next-line
    // @ts-ignore
    duplex: 'half',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
};

const nonPostFetch = async (url, { headers, method = 'GET' }) => {
  return fetch(url, {
    method,
    headers,
  });
};

const HttpRequestWorkerPlugin: IWorkerAdapter<
  { url?: string; data?: any; headers?: any; method: 'POST' | 'GET' },
  any
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.http-request',
  label: 'Request a resource via http request. 200 = success',
  version: '1.0.0',
  type: 'HTTP_REQUEST',

  async doWork({ url, data = {}, headers, method = 'POST' } = { method: 'POST' }) {
    if (!url) {
      return {
        success: false,
        error: {
          name: 'URL_REQUIRED',
          message: 'HTTP_REQUEST requires an url',
        },
      };
    }

    try {
      const normalizedFetch = method.toUpperCase() === 'POST' ? postFetch : nonPostFetch;
      const res = await normalizedFetch(url, { data, headers, method });

      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      const result = isJson ? await res.json() : { text: await res.text() };

      if (res.status === 200 && res.ok) {
        return { success: true, result };
      }
      return { success: false, result };
    } catch (err) {
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(HttpRequestWorkerPlugin);

export default HttpRequestWorkerPlugin;

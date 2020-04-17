import { WorkerDirector } from 'meteor/unchained:core-worker';
import { log } from 'meteor/unchained:core-logger';
import fetch from 'isomorphic-unfetch';
import WorkerPlugin from './base';

const postFetch = async (url, { data, headers }) => {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
};

const nonPostFetch = async (url, { headers, method = 'GET' }) => {
  return fetch(url, {
    method,
    headers,
  });
};

class HttpRequestWorkerPlugin extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.http-request';

  static label = 'Request a resource via http request. 200 = success';

  static version = '1.0';

  static type = 'HTTP_REQUEST';

  static async doWork({ url, data = {}, headers, method = 'POST' } = {}) {
    log(`${this.key} -> doWork: ${method} ${url} ${data}`, {
      level: 'debug',
    });

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
      const normalizedFetch =
        method.toUpperCase() === 'POST' ? postFetch : nonPostFetch;
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
  }
}

WorkerDirector.registerPlugin(HttpRequestWorkerPlugin);

export default HttpRequestWorkerPlugin;

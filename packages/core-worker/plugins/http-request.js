import WorkerPlugin from './base';

import { log } from 'meteor/unchained:core-logger';

class HttpRequestWorkerPlugin extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.http-request';

  static label = 'Request a resource via http request. 200 = success';

  static version = '1.0';

  static type = 'HTTP_REQUEST';

  static async doWork({ url, data = {}, headers, method = 'post' }) {
    log(`HttpRequestWorkerPlugin -> doWork: ${url} ${data}`, {
      level: 'verbose'
    });

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json', ...headers }
      });

      console.log(res);

      const result = await res.json();

      if (res.status === 200) {
        return { success: true, result };
      } else {
        return { success: false, result };
      }
    } catch (err) {
      console.error(err.message);
      return {
        success: false,
        error
      };
    }
  }
}

export default HttpRequestWorkerPlugin;

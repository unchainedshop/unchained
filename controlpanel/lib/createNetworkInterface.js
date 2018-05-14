import { printAST, HTTPFetchNetworkInterface } from 'apollo-client';

export function printRequest(request) {
  return Object.assign({}, request, {
    query: printAST(request.query),
  });
}

export class UploadNetworkInterface extends HTTPFetchNetworkInterface {
  fetchFromRemoteEndpoint(req) {
    const options = this.isUpload(req)
      ? this.getUploadOptions(req)
      : this.getJSONOptions(req);
    return fetch(this._uri, options); // eslint-disable-line
  }

  isUpload({ request }) { // eslint-disable-line
    if (request.variables) {
      for (const key in request.variables) { // eslint-disable-line
        if (request.variables[key] instanceof FileList ||
            request.variables[key] instanceof File) {
          return true;
        }
      }
    }
    return false;
  }

  getJSONOptions({ request, options }) {
    return Object.assign({}, this._opts, { // eslint-disable-line
      body: JSON.stringify(printRequest(request)),
      method: 'POST',
    }, options, {
      headers: Object.assign({}, {
        Accept: '*/*',
        'Content-Type': 'application/json',
      }, options.headers),
    });
  }

  getUploadOptions({ request, options }) {
    const body = new FormData();
    const variables = {};
    Object.keys(request.variables).forEach((key) => {
      const v = request.variables[key];
      if (v instanceof FileList) {
        Array.from(v).forEach(f => body.append(key, f));
      } else if (v instanceof File) {
        body.append(key, v);
      } else {
        variables[key] = v;
      }
    });
    body.append('operationName', request.operationName);
    body.append('query', printAST(request.query));
    body.append('variables', JSON.stringify(variables));
    return Object.assign({}, this._opts, { // eslint-disable-line
      body,
      method: 'POST',
    }, options, {
      headers: Object.assign({}, {
        Accept: '*/*',
      }, options.headers),
    });
  }
}

export default function createNetworkInterface(opts) {
  const { uri } = opts;
  return new UploadNetworkInterface(uri, opts);
}

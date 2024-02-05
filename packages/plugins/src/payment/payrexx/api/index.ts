const baseUrl = 'https://api.payrexx.com/v1.0/';

export enum GatewayObjectStatus {
  waiting = 'waiting',
  confirmed = 'confirmed',
  cancelled = 'cancelled',
  declined = 'declined',
  authorized = 'authorized',
  reserved = 'reserved',
  refunded = 'refunded',
  refundpending = 'refundpending',
  'partially-refunded' = 'partially-refunded',
  chargeback = 'chargeback',
  error = 'error',
  uncaptured = '_',
}

export type GatewayObject = {
  status: GatewayObjectStatus;
  currency: string;
  amount: number;
  referenceId: string;
  invoices: {
    transactions: {
      id: string;
    }[];
  }[];
};

export type TransactionObject = any;

const createPayrexxAPI = (instance: string, secret: string) => ({
  async buildSignature(query = '') {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(query));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  },

  buildUrl(path, params = {}) {
    const url = new URL(path, baseUrl);
    url.search = new URLSearchParams({ instance, ...params }).toString();
    return url.href;
  },

  async chargePreAuthorized(id, params) {
    const queryParams = { ...params };
    const signature = await this.buildSignature(new URLSearchParams(queryParams).toString());
    queryParams.ApiSignature = signature;

    const url = this.buildUrl(`Transaction/${id}/`);

    const result = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(queryParams).toString(),
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (result.ok) {
      return result.json();
    }
    throw new Error(await result.text());
  },

  async deleteReservation(id) {
    const url = this.buildUrl(`Transaction/${id}/`, { ApiSignature: await this.buildSignature() });
    const result = await fetch(url, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (result.ok) {
      return result.json();
    }
    throw new Error(await result.text());
  },

  async getGateway(id): Promise<GatewayObject> {
    const url = this.buildUrl(`Gateway/${id}/`, { ApiSignature: await this.buildSignature() });
    const result = await fetch(url);
    if (!result.ok) throw new Error(await result.text());
    const { status, data } = await result.json();
    if (status !== 'success') return null;
    return data?.[0];
  },

  async createGateway(params): Promise<GatewayObject> {
    const queryParams = { ...params };
    const signature = await this.buildSignature(new URLSearchParams(queryParams).toString());
    queryParams.ApiSignature = signature;

    const url = this.buildUrl('Gateway/');
    const result = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams(queryParams).toString(),
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    if (result.ok) {
      return result.json();
    }
    throw new Error(await result.text());
  },
});

export default createPayrexxAPI;

// where you want to consume the payrexx module:
// const payrexx = payrexx.init(instance, api_secret);
// const response = await payrexx.createGateway({
//   amount: 100,
//   // add more fields here
// });

// if (response.status === 200) {
//   const gateway = response.data.data[0];
//   // here you will get the gateway
// }

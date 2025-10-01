import makeFetcher from './makeFetcher.js';

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

export interface GatewayObject {
  status: GatewayObjectStatus;
  currency: string;
  amount: number;
  referenceId: string;
  invoices: {
    transactions: {
      id: string;
    }[];
  }[];
}

export type TransactionObject = any;

const createPayrexxAPI = (instance: string, secret: string) => {
  const fetchPayrexx = makeFetcher(baseUrl, instance, secret);

  return {
    async chargePreAuthorized(id, params) {
      const result = await fetchPayrexx(`Transaction/${id}`, 'POST', params);
      if (result.ok) {
        return result.json();
      }
      throw new Error(await result.text());
    },

    async deleteReservation(id) {
      const result = await fetchPayrexx(`Transaction/${id}`, 'DELETE');
      if (result.ok) {
        return result.json();
      }
      throw new Error(await result.text());
    },

    async getGateway(id): Promise<GatewayObject | null> {
      const result = await fetchPayrexx(`Gateway/${id}`, 'GET');
      if (!result.ok) throw new Error(await result.text());
      const { status, data } = await result.json();
      if (status !== 'success') return null;
      return data?.[0];
    },

    async createGateway(params): Promise<GatewayObject> {
      const result = await fetchPayrexx('Gateway', 'POST', params);
      if (result.ok) {
        return result.json();
      }
      throw new Error(await result.text());
    },
  };
};

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

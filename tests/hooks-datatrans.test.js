import fetch from 'isomorphic-unfetch';
import { URLSearchParams } from 'url';
import { setupDatabase } from './helpers';

let connection;
let db; // eslint-disable-line

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Datatrans Hooks', () => {
    it('datatrans accepts payment', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'success');
      params.append('uppTransactionId', '180710155247074969');
      params.append('refno', '735821');
      params.append('amount', '1000');
      params.append('authorizationCode', '258235030');
      params.append('sign', '30916165706580013');
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('responseCode', '01');
      params.append('expy', '18');
      params.append('acqAuthorizationCode', '155258');
      params.append('merchantId', '1000011011');
      params.append('reqtype', 'CAA');
      params.append('currency', 'CHF');
      params.append('responseMessage', 'Authorized');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: params
      });
      expect(result.status).toBe(200);
    });

    it('datatrans rejects payment', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'error');
      params.append('uppTransactionId', '180710160458378622');
      params.append('refno', '497184');
      params.append('amount', '1000');
      params.append('errorMessage', 'declined');
      params.append('sign', '30916165706580013');
      params.append('errorCode', '1403');
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('expy', '18');
      params.append('merchantId', '1000011011');
      params.append('reqtype', 'CAA');
      params.append('errorDetail', 'Declined');
      params.append('currency', 'CHF');
      params.append('acqErrorCode', '50');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: params
      });
      expect(result.status).toBe(200);
    });
  });
});

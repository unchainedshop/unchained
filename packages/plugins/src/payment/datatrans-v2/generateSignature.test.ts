import { describe, it } from 'node:test';
import assert from 'node:assert';
import generateSignature from './generateSignature.ts';

describe('Datatrans Signature', () => {
  it('Correct hashing applies', async () => {
    const { security, signKey, timestamp, body } = {
      security: 'dynamic-sign' as any,
      signKey: '1337',
      timestamp: '12424123412',
      body: '{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency":"CHF","detail":{"authorize":{"acquirerAuthorizationCode":"100055"}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"1NTU1NQ=","refno2":"user","status":"authorized","transactionId":"card_check_authorized","type":"card_check"}',
    };
    assert.strictEqual(
      await generateSignature({ security, signKey })(timestamp, body),
      '5118c93025fdb16a110cdde3aa7669422da320cfe9478e35b531f45c4619d4db',
    );
  });
});

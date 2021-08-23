// https://api-reference.datatrans.ch/#operation/init

import { InitRequestPayload, InitResponse } from './types';

const init = async ({
  endpoint,
  secret,
  merchantId,
  ...payload
}: InitRequestPayload): Promise<InitResponse> => {
  const token = `${merchantId}:${secret}`;

  const reqBody = {
    ...payload,
    autoSettle: false,
  };

  const result = await fetch(`${endpoint}/v1/transactions`, {
    method: 'POST',
    body: JSON.stringify(reqBody),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(token, 'utf-8').toString('base64')}`,
    },
  });

  const json = await result.json();
  return json;
};

export default init;

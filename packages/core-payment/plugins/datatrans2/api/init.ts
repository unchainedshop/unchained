// https://api-reference.datatrans.ch/#operation/init

import type {
  FetchDatatransFn,
  InitRequestPayload,
  InitResponse,
} from './types';

const { ROOT_URL } = process.env;

const defaultRedirect = {
  successUrl: `${ROOT_URL}/payment/success`,
  cancelUrl: `${ROOT_URL}/payment/cancel`,
  errorUrl: `${ROOT_URL}/payment/error`,
};

export default async function init({
  option,
  redirect,
  ...payload
}: InitRequestPayload): Promise<InitResponse> {
  const reqBody = {
    ...payload,
    autoSettle: false,
    option: {
      ...(option || {}),
      createAlias: true,
      returnCustomerCountry: true,
      authenticationOnly: false,
    },
    redirect: {
      ...defaultRedirect,
      ...(redirect || {}),
    },
  };

  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans('/v1/transactions', reqBody);
  const json = await result.json();
  const location = result.headers.get('location');
  return {
    location,
    ...json,
  };
}

import { useMemo } from 'react';
import merge from 'deepmerge';
import isEqual from 'lodash.isequal';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import createApolloClient from './utils/createApolloClient';

const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__';

let apolloClient;

const initializeApollo = (
  initialState = null,
  { headers = {}, locale = '' } = {},
): ApolloClient => {
  const client =
    apolloClient ??
    createApolloClient({
      headers,
      locale,
    });

  if (initialState) {
    const existingCache = client.extract();

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s)),
        ),
      ],
    });
    client.cache.restore(data);
  }

  if (typeof window === 'undefined') return client;
  apolloClient = client;

  return client;
};

export function useApollo(pageProps, { endpoint = null, ...rest } = {}) {
  const state = pageProps?.[APOLLO_STATE_PROP_NAME];

  return useMemo(() => {
    return initializeApollo(state, { ...rest });
  }, [state, endpoint]);
}

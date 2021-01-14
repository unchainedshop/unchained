import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';

import { onError } from '@apollo/client/link/error';
import { toast } from 'react-toastify';
import getConfig from 'next/config';
import { createUploadLink } from 'apollo-upload-client';

const { publicRuntimeConfig } = getConfig() || {};

let apolloClient = null;

function create(initialState, headersOverride, getToken) {
  const browserFallback =
    process.browser && `${window.location.origin}/graphql`;
  const fallback =
    headersOverride && headersOverride.host
      ? `http://${headersOverride.host}/graphql`
      : browserFallback;
  const httpLink = createUploadLink({
    uri: publicRuntimeConfig.GRAPHQL_ENDPOINT || fallback,
    credentials: 'same-origin',
  });
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        toast(message, { type: toast.TYPE.ERROR });
        console.log( // eslint-disable-line
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations
          )}, Path: ${path}`
        );
      });
    }

    if (networkError) {
      console.log(`[Network error]: ${networkError}`); // eslint-disable-line
      toast(networkError);
    }
  });

  const middlewareLink = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    const headers = {};
    if (headersOverride && headersOverride['accept-language']) {
      headers['accept-language'] = headersOverride['accept-language'];
    }
    headers.authorization = getToken() ? `Bearer ${getToken()}` : null;
    operation.setContext({ headers });
    return forward(operation);
  });
  const cache = new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            workQueue: {
              keyFields: ['_id'],
              keyArgs: false,
              merge(_, incoming) { 
                return incoming?.sort((a, b) => a.created - b.created);
              },
            },
          }
        }
      },
    dataIdFromObject: result => {
      if(result?.__typename === 'Work') {
        return `${result.__typename}:${result?._id}:${result?.created}`
      } else {
      if (result?._id && result?.__typename) {
        return `${result.__typename}:${result._id}`;
      } else if (result?.id && result?.__typename) {
        return `${result.__typename}:${result.id}`;
      }
      return null;
    }
    }
  });
  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: ApolloLink.from([errorLink, middlewareLink, httpLink]),
    cache: cache.restore(initialState || {}),
  });
}

export default function initApollo(
  initialState,
  headersOverride = {},
  getToken
) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState, headersOverride, getToken);
  }

  // Reuse client on the client-side
  if (!apolloClient) {
    apolloClient = create(initialState, headersOverride, getToken);
  }

  return apolloClient;
}

import { ApolloClient } from 'apollo-client';
import {
  InMemoryCache,
  IntrospectionFragmentMatcher
} from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { toast } from 'react-toastify';
import fetch from 'isomorphic-unfetch';
import getConfig from 'next/config';
import { createUploadLink } from 'apollo-upload-client';
import introspectionQueryResultData from '../schema.json';

const { publicRuntimeConfig } = getConfig() || {};

let apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch;
}

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
});

function create(initialState, headersOverride, getToken) {
  const httpLink = createUploadLink({
    uri: publicRuntimeConfig.GRAPHQL_ENDPOINT,
    credentials: 'same-origin'
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
    fragmentMatcher,
    dataIdFromObject: result => {
      if (result._id && result.__typename) { // eslint-disable-line
        return `${result.__typename}:${result._id}`; // eslint-disable-line
      } else if (result.id && result.__typename) { // eslint-disable-line
        return `${result.__typename}:${result.id}`; // eslint-disable-line
      }
      return null;
    }
  });
  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: ApolloLink.from([errorLink, middlewareLink, httpLink]),
    cache: cache.restore(initialState || {})
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

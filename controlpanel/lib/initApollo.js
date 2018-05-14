import { ApolloClient } from 'apollo-client';
import { IntrospectionFragmentMatcher, InMemoryCache } from 'apollo-cache-inmemory'; // eslint-disable-line
import { createUploadLink } from 'apollo-upload-client';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { toast } from 'react-toastify';
import fetch from 'isomorphic-unfetch';
import schema from '../schema.json';
import env from './env';

let apolloClient = null;

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch;
}

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: schema.data,
});

function create(initialState, headersOverride, getToken) {
  const httpLink = createUploadLink({
    uri: env.GRAPHQL_ENDPOINT,
    credentials: 'same-origin',
  });
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({
        message, locations, path, ...rest
      }) => {
        toast(message, { type: 'error' });
        console.log( // eslint-disable-line
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
          , ...rest,
        );
      });
    }

    if (networkError) {
      console.log(`[Network error]: ${networkError}`); // eslint-disable-line
      toast(networkError);
    }
  });
  const middlewareLink = setContext(() => {
    const headers = {};
    if (headersOverride['accept-language']) {
      headers['accept-language'] = headersOverride['accept-language'];
    }
    headers.authorization = getToken() ? `Bearer ${getToken()}` : null;
    if (env.DEBUG) {
      console.warn(headers); //eslint-disable-line
    }
    return { headers };
  });

  const link = errorLink.concat(middlewareLink.concat(httpLink));
  const cache = new InMemoryCache({
    fragmentMatcher,
    dataIdFromObject: (result) => {
      if (result._id && result.__typename) { // eslint-disable-line
        return `${result.__typename}:${result._id}`; // eslint-disable-line
      } else if (result.id && result.__typename) { // eslint-disable-line
        return `${result.__typename}:${result.id}`; // eslint-disable-line
      }
      return null;
    },
  });
  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link,
    cache: cache.restore(initialState || {}),
  });
}

export default function initApollo(initialState, headersOverride, getToken) {
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

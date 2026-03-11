import { ApolloClient, ApolloLink, HttpLink } from '@apollo/client';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import apolloCache from './apolloCache';
import { CombinedGraphQLErrors } from '@apollo/client';

const allowedHeaders = [
  'accept-language',
  'pragma',
  'user-agent',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-proto',
  'x-forwarded-server',
  'x-mapihttpcapability',
  'x-real-ip',
  'x-user-identity',
  'host',
  'cookie',
  'authorization',
];

const setLocale = (headers, locale) => {
  const newHeaders = {
    ...Object.fromEntries(
      Object.entries(headers).filter(([key]) => {
        return allowedHeaders.includes(key?.toLowerCase());
      }),
    ),
    'accept-language': headers?.forceLocale || locale,
  };
  return { headers: newHeaders };
};

const resolveUri = () => {
  if (typeof window !== 'undefined') {
    return (
      process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
      `${window.location.origin}/graphql`
    );
  }
  return process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || '/graphql';
};

const createApolloClient = ({
  headers: headersOverride = {},
  locale,
}): ApolloClient => {
  const localeLink = new SetContextLink((prevContext) => {
    return setLocale({ ...headersOverride, ...prevContext.headers }, locale);
  });

  const uri = resolveUri();

  const httpLink = new HttpLink({
    uri,
    credentials: 'include',
    includeExtensions: true,
  });

  const errorLink = new ErrorLink(({ error, operation }) => {
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
            locations,
          )}, Path: ${path}, Extensions: ${JSON.stringify(extensions)}, Operation: ${operation.operationName}`,
        );
      });
    }

    if (error) {
      console.error(
        `[Network error]: ${error.message}, ${error.name} Operation: ${operation.operationName}`,
      );
    }
  });

  const cache = apolloCache(locale);

  const apolloClient = new ApolloClient({
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
    },

    ssrMode: typeof window === 'undefined',
    link: ApolloLink.from([errorLink, localeLink, httpLink].filter(Boolean)),
    cache,
    devtools: {
      enabled: process.env.NODE_ENV === 'development',
    },
  });

  return apolloClient;
};

if (process.env.NODE_ENV === 'development') {
  loadDevMessages();
  loadErrorMessages();
}

export default createApolloClient;

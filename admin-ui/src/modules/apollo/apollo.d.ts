// Apollo Client 4.2+ requires defaultOptions set on the client
// (see createApolloClient.ts) to be declared here for type safety.
// signatureStyle stays "classic" because hooks across the codebase pass
// explicit generic type arguments, which modern signatures reject.
import '@apollo/client';

declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface WatchQuery {
        errorPolicy: 'all';
      }
    }
  }

  export interface TypeOverrides {
    signatureStyle: 'classic';
  }
}

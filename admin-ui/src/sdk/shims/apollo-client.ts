import { hostDep } from './host';

const apollo = hostDep('@apollo/client');

export const ApolloClient = apollo.ApolloClient;
export const ApolloError = apollo.ApolloError;
export const ApolloLink = apollo.ApolloLink;
export const CombinedGraphQLErrors = apollo.CombinedGraphQLErrors;
export const HttpLink = apollo.HttpLink;
export const InMemoryCache = apollo.InMemoryCache;
export const NetworkStatus = apollo.NetworkStatus;
export const Observable = apollo.Observable;
export const concat = apollo.concat;
export const createHttpLink = apollo.createHttpLink;
export const from = apollo.from;
export const gql = apollo.gql;
export const makeVar = apollo.makeVar;
export const split = apollo.split;

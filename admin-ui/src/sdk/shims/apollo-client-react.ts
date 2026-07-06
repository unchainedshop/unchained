import { hostDep } from './host';

const apolloReact = hostDep('@apollo/client/react');

export const ApolloProvider = apolloReact.ApolloProvider;
export const skipToken = apolloReact.skipToken;
export const useApolloClient = apolloReact.useApolloClient;
export const useBackgroundQuery = apolloReact.useBackgroundQuery;
export const useFragment = apolloReact.useFragment;
export const useLazyQuery = apolloReact.useLazyQuery;
export const useLoadableQuery = apolloReact.useLoadableQuery;
export const useMutation = apolloReact.useMutation;
export const useQuery = apolloReact.useQuery;
export const useReactiveVar = apolloReact.useReactiveVar;
export const useReadQuery = apolloReact.useReadQuery;
export const useSubscription = apolloReact.useSubscription;
export const useSuspenseQuery = apolloReact.useSuspenseQuery;

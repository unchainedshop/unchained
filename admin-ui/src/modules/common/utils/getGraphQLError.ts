import { CombinedGraphQLErrors } from '@apollo/client';

const getGraphQLError = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0];
  return error as { message?: string; extensions?: { code?: string } };
};

export default getGraphQLError;

import { CombinedGraphQLErrors } from '@apollo/client';
import type { IntlShape } from 'react-intl';

const getGraphQLError = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0];
  return error as { message?: string; extensions?: { code?: string } };
};

const getUserManagementErrorMessage = (
  error: unknown,
  formatMessage: IntlShape['formatMessage'],
) => {
  const graphQLError = getGraphQLError(error);

  if (graphQLError?.extensions?.code === 'LastAdminError') {
    return formatMessage({
      id: 'last_admin_required',
      defaultMessage:
        "You can't delete the only active administrator or revoke their admin role. Assign the admin role to another active user first.",
    });
  }

  return (
    graphQLError?.message ||
    formatMessage({
      id: 'error-something-went-wrong',
      defaultMessage:
        'Unable to complete the task successfully. Please try again.',
    })
  );
};

export default getUserManagementErrorMessage;

import type { IntlShape } from 'react-intl';
import getGraphQLError from '../common/utils/getGraphQLError';

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

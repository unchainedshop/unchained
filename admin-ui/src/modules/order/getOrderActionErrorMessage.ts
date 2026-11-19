import type { IntlShape } from 'react-intl';
import getGraphQLError from '../common/utils/getGraphQLError';

const getOrderActionErrorMessage = (
  error: unknown,
  formatMessage: IntlShape['formatMessage'],
) => {
  const graphQLError = getGraphQLError(error);

  if (graphQLError?.extensions?.code === 'OrderLockedError') {
    return formatMessage({
      id: 'order_locked_error',
      defaultMessage:
        'Another process is working on this order right now. Please try again in a moment.',
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

export default getOrderActionErrorMessage;

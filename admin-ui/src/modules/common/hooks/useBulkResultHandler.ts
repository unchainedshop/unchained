import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

const useBulkResultHandler = () => {
  const { formatMessage } = useIntl();

  return useCallback(
    async (
      operation: () => Promise<any>,
      operationName: string,
    ): Promise<boolean> => {
      try {
        const result = await operation();
        const data = result?.data?.[operationName];
        if (data) {
          if (data.failedCount > 0) {
            toast.warning(
              formatMessage(
                {
                  id: 'bulk_operation_result',
                  defaultMessage:
                    '{successCount} succeeded, {failedCount} failed',
                },
                {
                  successCount: data.successCount,
                  failedCount: data.failedCount,
                },
              ),
            );
          } else {
            toast.success(
              formatMessage(
                {
                  id: 'bulk_operation_success',
                  defaultMessage: '{successCount} succeeded',
                },
                { successCount: data.successCount },
              ),
            );
          }
          return true;
        }
        return false;
      } catch (error) {
        toast.error(
          formatMessage({
            id: 'bulk_operation_error',
            defaultMessage: 'Operation failed. Please try again.',
          }),
        );
        return false;
      }
    },
    [formatMessage],
  );
};

export default useBulkResultHandler;

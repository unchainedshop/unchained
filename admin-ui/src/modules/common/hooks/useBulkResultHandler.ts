import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

export interface BulkActionResult {
  successCount: number;
  failedCount: number;
  failedIds: string[];
}

const isBulkActionResult = (value: unknown): value is BulkActionResult =>
  Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as BulkActionResult).successCount === 'number' &&
    typeof (value as BulkActionResult).failedCount === 'number' &&
    Array.isArray((value as BulkActionResult).failedIds),
  );

const useBulkResultHandler = () => {
  const { formatMessage } = useIntl();

  return useCallback(
    async (
      operation: () => Promise<unknown>,
      operationName: string,
    ): Promise<BulkActionResult | null> => {
      try {
        const result = await operation();
        const responseData =
          result && typeof result === 'object' && 'data' in result
            ? (result as { data?: unknown }).data
            : null;
        const data =
          responseData &&
          typeof responseData === 'object' &&
          operationName in responseData
            ? (responseData as Record<string, unknown>)[operationName]
            : null;
        if (isBulkActionResult(data)) {
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
          return data;
        }
        return null;
      } catch (error) {
        toast.error(
          formatMessage({
            id: 'bulk_operation_error',
            defaultMessage: 'Operation failed. Please try again.',
          }),
        );
        return null;
      }
    },
    [formatMessage],
  );
};

export default useBulkResultHandler;

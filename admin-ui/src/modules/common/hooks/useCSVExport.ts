import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useIntl } from 'react-intl';
import useAddWork from '../../work/hooks/useAddWork';
import {
  IWorkQuery,
  IWorkQueryVariables,
  IWorkStatus,
  IWorkType,
} from '../../../gql/types';
import { useApolloClient } from '@apollo/client/react';
import { GetWorkQuery } from '../../work/hooks/useWork';
import { useRouter } from 'next/router';

export interface ExportParams {
  type: string;
  pollInterval?: number;
  [key: string]: unknown;
}

export const useCSVExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const client = useApolloClient();
  const router = useRouter();
  const { addWork } = useAddWork();
  const { formatMessage } = useIntl();

  const getWorkStatus = useCallback(
    async (workId: string) => {
      const { data } = await client.query<IWorkQuery, IWorkQueryVariables>({
        query: GetWorkQuery(),
        variables: { workId },
        fetchPolicy: 'network-only',
      });

      return data?.work ?? null;
    },
    [client],
  );

  const exportCSV = useCallback(
    async ({ type, pollInterval = 2000, ...params }: ExportParams) => {
      setIsExporting(true);
      try {
        const worker = await addWork({
          type: IWorkType.BulkExport,
          input: { type, ...params },
        });
        const workId = worker?.data?.addWork?._id;
        if (!workId) throw new Error('Failed to create export work');

        await new Promise<unknown>((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const work = await getWorkStatus(workId);
              if (!work) throw new Error('Work not found');

              if (
                work.status === IWorkStatus.Success ||
                work.status === IWorkStatus.Failed
              ) {
                clearInterval(interval);

                if (work.status === IWorkStatus.Success && work.success) {
                  router.push(`/exports?workId=${work._id}`);
                  resolve(work);
                } else {
                  reject(work.error || new Error('Export failed'));
                }
              }
            } catch (err) {
              clearInterval(interval);
              reject(err);
            }
          }, pollInterval);
        });
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(
          formatMessage({
            id: 'export_failed',
            defaultMessage: 'Export failed. Please try again.',
          }),
        );
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [addWork, getWorkStatus, router, formatMessage],
  );

  return { isExporting, exportCSV };
};

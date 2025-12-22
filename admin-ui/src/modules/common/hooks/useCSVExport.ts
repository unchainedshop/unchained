import { useState, useCallback } from 'react';
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

export const useCSVExport = (onError?: (error: any) => void) => {
  const [isExporting, setIsExporting] = useState(false);
  const client = useApolloClient();
  const router = useRouter();
  const { addWork } = useAddWork();

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

  const downloadFiles = (files: Record<string, { url: string }>) => {
    Object.values(files)
      .filter(Boolean)
      .forEach((file) => {
        const a = document.createElement('a');
        a.href = file?.url;
        a.target = '_blank';
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const exportCSV = useCallback(
    async ({ type, pollInterval = 2000, ...params }: any) => {
      setIsExporting(true);
      try {
        const worker = await addWork({
          type: IWorkType.BulkExport,
          input: { type, ...params },
        });
        const workId = worker?.data?.addWork?._id;
        if (!workId) throw new Error('Failed to create export work');

        return await new Promise<any>((resolve, reject) => {
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
                  if (work.result?.files) {
                    downloadFiles(work.result.files);
                  }
                  router.push(`/works?workerId=${work?._id}`);
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
        if (onError) onError(error);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [addWork, getWorkStatus, onError],
  );

  return { isExporting, exportCSV };
};

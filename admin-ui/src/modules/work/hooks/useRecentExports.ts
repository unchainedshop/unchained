import { useMemo } from 'react';
import { IWorkStatus, IWorkType } from '../../../gql/types';
import useWorkQueue from './useWorkQueue';
const getActiveFilesAndCount = (workQueue) => {
  const now = Date.now();

  const activeFiles = workQueue.flatMap((work) => {
    const finishedTime = new Date(work.finished).getTime();

    return Object.entries(
      (work.result?.files || []) as { url: string; expires: number }[],
    )
      .filter(([_, file]) => {
        return file?.url && finishedTime + file.expires > now;
      })
      .map(([key, file]) => ({
        name: key,
        url: file.url,
        finished: work.finished,
        expiresAt: new Date(finishedTime + file.expires).toISOString(),
      }));
  });

  return {
    files: activeFiles,
    count: activeFiles.length,
  };
};

const useRecentExports = () => {
  const twentyFourHoursAgo = useMemo(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    [],
  );
  const { workQueue } = useWorkQueue({
    types: [IWorkType.BulkExport],
    created: {
      start: twentyFourHoursAgo,
    },
    status: [IWorkStatus.Success],
    pollInterval: 60000,
  });
  return getActiveFilesAndCount(workQueue);
};

export default useRecentExports;

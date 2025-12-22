import { useMemo } from 'react';
import {
  ISortDirection,
  ISortOptionInput,
  IWorkStatus,
  IWorkType,
} from '../../../gql/types';
import useWorkQueue from './useWorkQueue';
const getActiveFilesAndCount = (workQueue) => {
  const now = Date.now();
  if (!workQueue.length)
    return {
      files: [],
      count: 0,
    };
  const activeFiles = workQueue.flatMap((work) => {
    const finishedTime = new Date(work.finished).getTime();

    return Object.entries(
      (work.result?.files || []) as { url: string; expires: number }[],
    )
      .filter(([_, file]) => {
        return file?.url;
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

const useRecentExports = ({
  sortOptions,
}: { sortOptions?: ISortOptionInput[] } = {}) => {
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
    sort: (sortOptions || []).length
      ? sortOptions
      : [{ key: 'finished', value: ISortDirection.Desc }],
  });
  return getActiveFilesAndCount(workQueue);
};

export default useRecentExports;

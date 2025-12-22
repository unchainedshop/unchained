import { useMemo } from 'react';
import {
  ISortDirection,
  ISortOptionInput,
  IWorkStatus,
  IWorkType,
} from '../../../gql/types';
import useWorkQueue from './useWorkQueue';
type ExportedWork = {
  input: { type: string };
  status: IWorkStatus;
  _id: string;
  type: IWorkType;
  result: { files: { [key: string]: { url: string; expires: number } } };
  finished: Date;
};
const getActiveFilesAndCount = (workQueue: ExportedWork[]) => {
  if (!workQueue.length)
    return {
      exports: [],
      count: 0,
    };
  const groupedData = (workQueue || [])
    .map((work) => {
      const finishedTime = new Date(work.finished).getTime();
      const activeFiles = Object.entries(work.result?.files || {})
        .filter(([_, file]) => file?.url)
        .map(([key, file]) => ({
          name: key.toUpperCase(),
          url: file.url,
          expiresAt: new Date(finishedTime + file.expires).toLocaleString(),
        }));
      if (activeFiles.length === 0) return null;

      return {
        id: work._id,
        type: work?.input.type,
        finished: new Date(work.finished).toLocaleString(),
        files: activeFiles,
      };
    })
    .filter(Boolean);

  const totalFiles = groupedData.reduce(
    (acc, work) => acc + work.files.length,
    0,
  );
  return {
    count: totalFiles,
    exports: groupedData,
  };
};

const useRecentExports = ({
  queryString = null,
  sortOptions,
}: { sortOptions?: ISortOptionInput[]; queryString?: string } = {}) => {
  const twentyFourHoursAgo = useMemo(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    [],
  );
  const { workQueue } = useWorkQueue({
    types: [IWorkType.BulkExport],
    queryString,
    created: {
      start: twentyFourHoursAgo,
    },
    status: [IWorkStatus.Success],
    pollInterval: 60000,
  });
  return getActiveFilesAndCount(workQueue as ExportedWork[]);
};

export default useRecentExports;

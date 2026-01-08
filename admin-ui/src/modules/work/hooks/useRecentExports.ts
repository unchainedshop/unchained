import { useMemo } from 'react';
import { ISortOptionInput, IWorkStatus, IWorkType } from '../../../gql/types';
import useWorkQueue from './useWorkQueue';

interface ExportFileInfo {
  url: string;
  expires: number;
}

interface ExportedWork {
  _id: string;
  type: IWorkType;
  status: IWorkStatus;
  input: { type: string };
  result: { files: Record<string, ExportFileInfo | null> };
  finished: Date;
}

interface ActiveFile {
  name: string;
  url: string;
  expiresAt: string;
}

interface ExportGroup {
  id: string;
  type: string;
  finished: string;
  files: ActiveFile[];
}

interface RecentExportsResult {
  count: number;
  exports: ExportGroup[];
}

const getActiveFilesAndCount = (
  workQueue: ExportedWork[],
): RecentExportsResult => {
  if (!workQueue?.length) {
    return { exports: [], count: 0 };
  }

  const now = Date.now();

  const groupedData = workQueue
    .map((work): ExportGroup | null => {
      const finishedTime = new Date(work.finished).getTime();

      const activeFiles = Object.entries(work.result?.files || {})
        .filter(([, file]) => {
          if (!file?.url) return false;
          if (!file?.expires) return true;
          return file.expires > now;
        })
        .map(([key, file]) => ({
          name: key.toUpperCase(),
          url: file!.url,
          expiresAt: new Date(finishedTime + file!.expires).toLocaleString(),
        }));

      if (activeFiles.length === 0) return null;

      return {
        id: work._id,
        type: work.input?.type,
        finished: new Date(work.finished).toLocaleString(),
        files: activeFiles,
      };
    })
    .filter((item): item is ExportGroup => item !== null);

  const totalFiles = groupedData.reduce(
    (acc, work) => acc + work.files.length,
    0,
  );

  return { count: totalFiles, exports: groupedData };
};

interface UseRecentExportsParams {
  sortOptions?: ISortOptionInput[];
  queryString?: string | null;
}

const useRecentExports = ({
  queryString = null,
  sortOptions,
}: UseRecentExportsParams = {}): RecentExportsResult => {
  const twentyFourHoursAgo = useMemo(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  const { workQueue } = useWorkQueue({
    types: [IWorkType.BulkExport],
    queryString,
    created: { start: twentyFourHoursAgo },
    status: [IWorkStatus.Success],
    pollInterval: 60000,
  });

  return getActiveFilesAndCount(workQueue as ExportedWork[]);
};

export default useRecentExports;

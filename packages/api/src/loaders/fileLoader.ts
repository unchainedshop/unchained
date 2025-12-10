import type { UnchainedCore } from '@unchainedshop/core';
import type { File } from '@unchainedshop/core-files';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ fileId: string }, File>(async (queries) => {
    const fileIds = [...new Set(queries.map((q) => q.fileId).filter(Boolean))];

    const files = await unchainedAPI.modules.files.findFiles({
      _id: { $in: fileIds },
    });

    const fileMap = {};
    for (const file of files) {
      fileMap[file._id] = file;
    }

    return queries.map((q) => fileMap[q.fileId]);
  });

import { Readable } from 'stream';
import { getFileAdapter } from '@unchainedshop/core-files';
import { Modules } from '../modules.js';

export type CreateDownloadStreamService = (
  params: {
    fileId: string;
  },
  unchainedAPI: { modules: Modules },
) => Promise<Readable>;

export const createDownloadStreamService: CreateDownloadStreamService = async (
  { fileId },
  unchainedContext,
) => {
  const {
    modules: { files },
  } = unchainedContext;
  const fileAdapter = getFileAdapter();

  const file = await files.findFile({ fileId });
  const stream = fileAdapter.createDownloadStream(file, unchainedContext);
  return stream;
};

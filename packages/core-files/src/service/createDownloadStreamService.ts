import { getFileAdapter } from '../utils/getFileAdapter.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { Readable } from 'stream';

export type CreateDownloadStreamService = (
  params: {
    fileId: string;
  },
  unchainedAPI: UnchainedCore,
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

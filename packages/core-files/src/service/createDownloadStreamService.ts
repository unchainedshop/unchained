import { CreateDownloadStreamService } from '@unchainedshop/types/files.js';
import { getFileAdapter } from '../utils/getFileAdapter.js';

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

import { Readable } from 'stream';
import { FilesModule, getFileAdapter } from '@unchainedshop/core-files';

export type CreateDownloadStreamService = (
  params: {
    fileId: string;
  },
  unchainedAPI: { modules: { files: FilesModule } },
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

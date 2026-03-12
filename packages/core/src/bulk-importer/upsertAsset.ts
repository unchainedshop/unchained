import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';
import type { Services } from '../services/index.ts';
import { z } from 'zod/v4-mini';

const logger = createLogger('unchained:bulk-import');

export const AssetSchema = z.object({
  _id: z.optional(z.string()),
  url: z.string(),
  meta: z.optional(z.record(z.any(), z.any())),
  fileName: z.string(),
  headers: z.optional(z.record(z.string(), z.any())),
});

const upsertAsset = async (
  directoryName: string,
  asset: z.infer<typeof AssetSchema>,
  unchainedAPI: { modules: Modules; services: Services },
) => {
  const { modules, services } = unchainedAPI;
  const { _id: fileId, fileName, url, meta, headers, ...assetData } = asset;

  try {
    const existingFile = fileId && (await modules.files.findFile({ fileId }));
    if (existingFile) {
      if (JSON.stringify(meta) === JSON.stringify(existingFile.meta)) {
        return existingFile;
      }
      await modules.files.update(fileId, { meta, ...assetData });
      const updatedFile = await modules.files.findFile({ fileId });
      return updatedFile;
    }

    const assetObject = await services.files.uploadFileFromURL({
      directoryName,
      fileInput: {
        fileLink: url,
        fileName,
        fileId,
        headers,
      },
      meta,
    });

    return assetObject;
  } catch (e) {
    logger.warn(`Unable to upsert asset ${fileId || fileName}: ${e.message}`);
    return null;
  }
};

export default upsertAsset;

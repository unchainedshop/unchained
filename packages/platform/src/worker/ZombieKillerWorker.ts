import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from '@unchainedshop/logger';
import { BaseAdapter } from '@unchainedshop/utils';

const logger = createLogger('unchained:platform:zombie-killer');

const findId = { projection: { _id: 1 } };
const findFileId = { projection: { mediaId: 1 } };
const mapId = (a: any) => a._id;

export const ZombieKillerWorker: IWorkerAdapter<
  never,
  {
    deletedProductMediaCount: number;
    deletedAssortmentMediaCount: number;
    deletedFilesCount: number;
  }
> = {
  ...BaseAdapter,

  key: 'shop.unchained.worker-plugin.zombie-killer',
  label: 'Zombie Killer',
  version: '1.0',
  type: 'ZOMBIE_KILLER',

  doWork: async (_, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    try {
      const error = false;

      // Remove unreferenced product media objects
      const products = await modules.products.findProducts({}, findId);
      const deletedProductMediaCount = await modules.products.media.deleteMediaFiles({
        excludedProdcutIds: products.map(mapId),
      });

      // Remove unreferenced assortment media objects
      const assortments = await modules.assortments.findAssortments({}, findId);
      const deletedAssortmentMediaCount = await modules.assortments.media.deleteMediaFiles({
        excludedAssortmentIds: assortments.map(mapId),
      });

      // Remove unreferenced files
      const fileIdsToRemove = [];
      const productMedia = await modules.products.media.findProductMedias({}, findFileId);
      const assortmentMedia = await modules.assortments.media.findAssortmentMedias({}, findFileId);

      const filesWithProductId = await modules.files.findFilesByMetaData({
        meta: {
          productId: { $exists: true },
        },
      });
      const filesWithAssortmentId = await modules.files.findFilesByMetaData({
        meta: {
          assortmentId: { $exists: true },
        },
      });

      filesWithProductId
        .concat(filesWithAssortmentId)
        .filter((file) => {
          const fileInProductMedia = productMedia.some((media) => media.mediaId === file._id);
          const fileInAssortmentMedia = assortmentMedia.some((media) => media.mediaId === file._id);
          return !fileInProductMedia && !fileInAssortmentMedia;
        })
        .forEach((m) => fileIdsToRemove.push(m._id));

      const deletedFilesCount =
        fileIdsToRemove.length > 0
          ? await services.files.removeFiles(
            {
              fileIds: fileIdsToRemove,
            },
            unchainedAPI,
          )
          : 0;

      // Return delete count
      const result = {
        deletedProductMediaCount,
        deletedAssortmentMediaCount,
        deletedFilesCount,
      };

      if (error) {
        return {
          success: false,
          result,
          error,
        };
      }
      return {
        success: true,
        result,
      };
    } catch (err) {
      logger.error(err.message, err);
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

export default ZombieKillerWorker;

WorkerDirector.registerAdapter(ZombieKillerWorker);

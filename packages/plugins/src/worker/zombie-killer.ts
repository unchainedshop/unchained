import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:platform:zombie-killer');

const mapId = (a: any) => a._id;

export const ZombieKillerWorker: IWorkerAdapter<
  never,
  {
    deletedProductMediaCount: number;
    deletedAssortmentMediaCount: number;
    deletedFilesCount: number;
  }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.zombie-killer',
  label: 'Zombie Killer',
  version: '1.0.0',
  type: 'ZOMBIE_KILLER',

  doWork: async (_, unchainedAPI) => {
    const { modules, services } = unchainedAPI;

    try {
      const error = false;

      // Remove unreferenced assortment media objects
      const assortments = await modules.assortments.findAssortments(
        { includeInactive: true, includeLeaves: true },
        { projection: { _id: 1 } },
      );
      const deletedAssortmentMediaCount = await modules.assortments.media.deleteMediaFiles({
        excludedAssortmentIds: assortments.map(mapId),
      });

      // Remove unreferenced product media objects
      const products = await modules.products.findProducts(
        { includeDrafts: true },
        { projection: { _id: 1 } },
      );
      const deletedProductMediaCount = await modules.products.media.deleteMediaFiles({
        excludedProductIds: products.map(mapId),
      });

      // Remove unreferenced files
      const productMedia = await modules.products.media.findProductMedias(
        {},
        { projection: { mediaId: 1 } },
      );
      const assortmentMedia = await modules.assortments.media.findAssortmentMedias(
        {},
        { projection: { mediaId: 1 } },
      );

      const allFileIdsLinked = [...productMedia, ...assortmentMedia].map((l) => l?.mediaId);
      const allFileIdsRelevant = (
        await modules.files.findFiles(
          { path: { $in: ['product-media', 'assortment-media'] } },
          { projection: { _id: 1 } },
        )
      ).map(mapId);

      const fileIdsToRemove = allFileIdsRelevant.filter((fileId) => {
        return !allFileIdsLinked.includes(fileId);
      });

      logger.verbose(`File Id's to remove: ${fileIdsToRemove.join(', ')}`);

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

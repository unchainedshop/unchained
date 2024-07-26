import { IWorkerAdapter } from '@unchainedshop/core-worker';
import { WorkerDirector, WorkerAdapter } from '@unchainedshop/core-worker';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:platform:zombie-killer');

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

      // Remove unreferenced filter entities
      const filters = await modules.filters.findFilters(
        { includeInactive: true },
        { projection: { _id: 1 } },
      );
      const filterIds = filters.map((a) => a._id);
      const deletedFilterTextsCount = await modules.filters.texts.deleteMany({
        excludedFilterIds: filterIds,
      });

      // Remove unreferenced assortment entities
      const assortments = await modules.assortments.findAssortments(
        { includeInactive: true, includeLeaves: true },
        { projection: { _id: 1 } },
      );
      const assortmentIds = assortments.map((a) => a._id);
      const deletedAssortmentTextsCount = await modules.assortments.texts.deleteMany({
        excludedAssortmentIds: assortmentIds,
      });
      const deletedAssortmentMediaCount = await modules.assortments.media.deleteMediaFiles({
        excludedAssortmentIds: assortmentIds,
      });

      // Remove unreferenced product entities
      const products = await modules.products.findProducts(
        { includeDrafts: true },
        { projection: { _id: 1 } },
      );
      const productIds = products.map((a) => a._id);
      const deletedProductTextsCount = await modules.products.texts.deleteMany({
        excludedProductIds: productIds,
      });
      const deletedProductVariationsCount = await modules.products.variations.deleteVariations({
        excludedProductIds: productIds,
      });
      const deletedProductMediaCount = await modules.products.media.deleteMediaFiles({
        excludedProductIds: productIds,
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
      ).map((a) => a._id);

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
        deletedFilterTextsCount,
        deletedProductMediaCount,
        deletedProductTextsCount,
        deletedProductVariationsCount,
        deletedAssortmentMediaCount,
        deletedAssortmentTextsCount,
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

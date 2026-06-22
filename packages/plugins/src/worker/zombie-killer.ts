import { type IWorkerAdapter, WorkerAdapter, WorkerDirector, schedule } from '@unchainedshop/core';

// Daily, off-peak (a little before the guest GC so dead carts left by other paths
// are reaped on their own cadence).
const everyDayAtTwo = schedule.parse.cron('0 2 * * *');

export const ZombieKillerWorker: IWorkerAdapter<
  { bulkImportMaxAgeInDays: number },
  {
    deletedProductMediaCount: number;
    deletedAssortmentMediaCount: number;
    deletedFilesCount: number;
    deletedFilterTextsCount: number;
    deletedProductTextsCount: number;
    deletedProductVariationsCount: number;
    deletedAssortmentTextsCount: number;
    deletedCartsCount: number;
  }
> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.zombie-killer',
  label: 'Zombie Killer',
  version: '1.0.0',
  type: 'ZOMBIE_KILLER',

  doWork: async (input, unchainedAPI) => {
    const { modules, services } = unchainedAPI;
    // Autoscheduling enqueues the work without input, so tolerate undefined/null/{}.
    const { bulkImportMaxAgeInDays = 5 } = input || {};

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
      const assortments = await modules.assortments.findAssortments({
        includeInactive: true,
        includeLeaves: true,
      });
      const assortmentIds = assortments.map((a) => a._id);
      const deletedAssortmentTextsCount = await modules.assortments.texts.deleteMany({
        excludedAssortmentIds: assortmentIds,
      });
      const deletedAssortmentMediaCount = await modules.assortments.media.deleteMediaFiles({
        excludedAssortmentIds: assortmentIds,
      });

      // Remove unreferenced product entities
      const productIds = await modules.products.findProductIds({ includeDrafts: true });
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
          { paths: ['product-media', 'assortment-media'] },
          { projection: { _id: 1, expires: 1 } },
        )
      )
        // Skip in-progress uploads. A signed-URL upload creates the file with an `expires`
        // ticket and only links it (products/assortments media.create) once the client calls
        // confirmMediaUpload -> files.unexpire ($unset expires). Reaping a file whose ticket is
        // still open would delete it out from under a valid upload. Committed files have `expires`
        // unset; abandoned tickets are reaped on their own by the TTL index on `expires`.
        .filter((file) => !file.expires)
        .map((a) => a._id);

      const fileIdsToRemove =
        allFileIdsRelevant.filter((fileId) => {
          return !allFileIdsLinked.includes(fileId);
        }) || [];

      // Remove bulk import streams older than X days
      const bulkImportMedia = await await modules.files.findFiles({
        path: 'bulk-import-streams',
        createdBefore: new Date(Date.now() - 1000 * 60 * 60 * 24 * bulkImportMaxAgeInDays),
      });
      bulkImportMedia.forEach(async (media) => {
        fileIdsToRemove.push(media._id);
      });

      const deletedFilesCount =
        fileIdsToRemove.length > 0
          ? await services.files.removeFiles({
              fileIds: fileIdsToRemove,
            })
          : 0;

      // Remove dead carts: open carts whose owner no longer exists (a user was
      // hard-deleted by a path that didn't cascade, or legacy data). The user-existence
      // check crosses collections, so it lives here in the worker.
      const cartUserIds = (await modules.orders.findCartUserIds()).filter(Boolean);
      const existingUserIds = new Set(
        cartUserIds.length ? await modules.users.findExistingUserIds({ userIds: cartUserIds }) : [],
      );
      const deadUserIds = cartUserIds.filter((userId) => !existingUserIds.has(userId));
      const deadCarts = deadUserIds.length
        ? await modules.orders.findCarts({ userIds: deadUserIds }, { projection: { _id: 1 } })
        : [];
      let deletedCartsCount = 0;
      await Array.fromAsync(deadCarts, async (cart) => {
        await services.orders.deleteCart(cart._id);
        deletedCartsCount += 1;
      });

      // Return delete count
      const result = {
        deletedFilterTextsCount,
        deletedProductMediaCount,
        deletedProductTextsCount,
        deletedProductVariationsCount,
        deletedAssortmentMediaCount,
        deletedAssortmentTextsCount,
        deletedFilesCount,
        deletedCartsCount,
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

WorkerDirector.configureAutoscheduling({
  type: ZombieKillerWorker.type,
  schedule: everyDayAtTwo,
  retries: 2,
});

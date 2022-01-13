import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { BaseAdapter } from 'meteor/unchained:utils';
import { IWorkerAdapter } from '@unchainedshop/types/worker';

const logger = createLogger('unchained:platform:zombie-killer');

const findId = { projection: { _id: 1 } };
const findFileId = { projection: { mediaId: 1 } };
const mapId = (a: any) => a._id;

const ZombieKillerWorker: IWorkerAdapter<
  never,
  {
    deletedAssortmentFileCount: number;
    deletedAssortmentMediaCount: number;
    deletedProductFileCount: number;
    deletedProductMediaCount: number;
  }
> = {
  ...BaseAdapter,

  key: 'shop.unchained.worker-plugin.zombie-killer',
  label: 'Zombie Killer',
  version: '1.0',
  type: 'ZOMBIE_KILLER',

  doWork: async (_, requestContext) => {
    const { modules, userId } = requestContext;

    try {
      const error = false;

      // Remove unreferenced product media objects
      const products = await modules.products.findProducts({}, findId);
      const deletedProductMediaCount =
        await modules.products.media.deleteMediaFiles({
          excludedProdcutIds: products.map(mapId),
        });

      // Remove unreferenced assortment media objects
      const assortments = await modules.assortments.findAssortments({}, findId);
      const deletedAssortmentMediaCount =
        await modules.assortments.media.deleteMediaFiles({
          excludedAssortmentIds: assortments.map(mapId),
        });

      // Remove unreferenced product files
      const productMediaFiles = await modules.products.media.findProductMedias(
        {},
        findFileId
      );
      const deletedProductFileCount = await modules.files.removeFiles({
        excludedFileIds: productMediaFiles.map((m) => m.mediaId),
      });

      // Remove unreferended assortment files
      const assortmentMediaFiles =
        await modules.assortments.media.findAssortmentMedias({}, findFileId);
      const deletedAssortmentFileCount = await modules.files.removeFiles({
        excludedFileIds: assortmentMediaFiles.map((m) => m.mediaId),
      });

      // Return delete count
      const result = {
        deletedProductMediaCount,
        deletedAssortmentMediaCount,
        deletedProductFileCount,
        deletedAssortmentFileCount,
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

WorkerDirector.registerAdapter(ZombieKillerWorker);

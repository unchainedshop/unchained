import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { Products, ProductMedia } from 'meteor/unchained:core-products';
import {
  Assortments,
  AssortmentMedia,
} from 'meteor/unchained:core-assortments';
import { MediaObjects, removeObjects } from 'meteor/unchained:ore-files-next';

const logger = createLogger('unchained:platform:zombie-killer');

class ZombieKiller extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.zombie-killer';

  static label = 'Zombie Killer';

  static version = '1.0';

  static type = 'ZOMBIE_KILLER';

  static async doWork() {
    try {
      const error = false;

      const productMedia = ProductMedia.remove({
        productId: {
          $nin: Products.find({}, { fields: { _id: true } }).map((p) => p._id),
        },
      });

      const assortmentMedia = AssortmentMedia.remove({
        productId: {
          $nin: Assortments.find({}, { fields: { _id: true } }).map(
            (a) => a._id
          ),
        },
      });

      const productMediaIds = MediaObjects.find(
        {
          _id: {
            $nin: ProductMedia.find(
              {},
              {
                fields: {
                  mediaId: true,
                },
              }
            ).map((m) => m.mediaId),
          },
        },
        {
          fields: {
            _id: true,
          },
        }
      ).map((i) => i._id);

      const media = await removeObjects(productMediaIds);

      const assortmentMediaIds = MediaObjects.find(
        {
          _id: {
            $nin: AssortmentMedia.find(
              {},
              {
                fields: {
                  mediaId: true,
                },
              }
            ).map((m) => m.mediaId),
          },
        },
        {
          fields: {
            _id: true,
          },
        }
      );

      const assortmentDocuments = await removeObjects(assortmentMediaIds);

      const result = {
        productMedia,
        media,
        assortmentMedia,
        assortmentDocuments,
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
  }
}

WorkerDirector.registerPlugin(ZombieKiller);

export default ZombieKiller;

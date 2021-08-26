import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:core-logger';
import { Products, ProductMedia, Media } from 'meteor/unchained:core-products';
import {
  Assortments,
  AssortmentMedia,
  AssortmentDocuments,
} from 'meteor/unchained:core-assortments';

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

      const media = Media.remove({
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
      });

      const assortmentDocuments = AssortmentDocuments.remove({
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
      });

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

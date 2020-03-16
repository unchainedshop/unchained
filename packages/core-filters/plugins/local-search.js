import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';
import { ProductTexts } from 'meteor/unchained:core-products';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

ProductTexts.rawCollection().createIndex({
  title: 'text',
  subtitle: 'text',
  vendor: 'text',
  brand: 'text'
});

class LocalSearch extends FilterAdapter {
  static key = 'shop.unchained.filters.local-search';

  static label = 'Simple Fulltext search with MongoDB';

  static version = '0.1';

  static orderIndex = 1;

  static isActivatedFor(context) {
    return Boolean(context.query);
  }

  async search(productIdResolver) {
    // eslint-disable-line
    const { query = {} } = this.context;
    const { queryString } = query;

    if (!queryString) return productIdResolver;

    const restrictedProductIds = await productIdResolver;

    const selector = AMAZON_DOCUMENTDB_COMPAT_MODE
      ? {
          $or: [
            { title: { $regex: `${queryString}`, $options: 'im' } },
            { subtitle: { $regex: `${queryString}`, $options: 'im' } },
            { vendor: { $regex: `${queryString}`, $options: 'im' } },
            { brand: { $regex: `${queryString}`, $options: 'im' } },
            { description: { $regex: `${queryString}`, $options: 'im' } },
            { labels: { $regex: `${queryString}`, $options: 'im' } }
          ]
        }
      : {
          $text: { $search: queryString }
        };

    if (restrictedProductIds) {
      selector.productId = { $in: new Set(restrictedProductIds) };
    }

    const productIds = ProductTexts.find(selector, {
      fields: {
        productId: 1
      }
    }).map(({ productId }) => productId);

    return productIds;
  }

  async transformFilterSelector(last) {
    // eslint-disable-line
    const { query = {} } = this.context;
    const { queryString } = query;

    if (queryString) {
      return {
        isActive: true
      };
    }

    return last;
  }
}

FilterDirector.registerAdapter(LocalSearch);

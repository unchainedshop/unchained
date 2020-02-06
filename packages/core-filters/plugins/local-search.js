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

    const allProductIds = await productIdResolver;
    if (allProductIds && allProductIds.length === 0) return productIdResolver;

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

    selector.productId = { $in: allProductIds };

    const productIds = ProductTexts.find(selector, {
      fields: {
        productId: 1
      }
    }).map(({ productId }) => productId);

    return productIds;
  }
}

FilterDirector.registerAdapter(LocalSearch);

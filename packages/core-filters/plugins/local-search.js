import { FilterDirector, FilterAdapter } from 'meteor/unchained:core-filters';
import { ProductTexts } from 'meteor/unchained:core-products';

class LocalSearch extends FilterAdapter {
  static key = 'shop.unchained.filters.local-search';

  static label = 'Simple Fulltext search with MongoDB';

  static version = '0.1';

  static orderIndex = 1;

  static isActivatedFor(context) { // eslint-disable-line
    return Boolean(context.query);
  }

  async search(productIdResolver) { // eslint-disable-line
    const { query = {} } = this.context;
    const { queryString } = query;

    if (!queryString) return productIdResolver;

    const selector = {
      $text: { $search: queryString }
    };

    const allProductIds = await productIdResolver;
    if (allProductIds && allProductIds.length > 0) {
      selector.productId = { $in: allProductIds };
    }

    const productIds = ProductTexts.find(selector, {
      fields: {
        productId: 1
      }
    }).map(({ productId }) => productId);

    return productIds;
  }
}

FilterDirector.registerAdapter(LocalSearch);

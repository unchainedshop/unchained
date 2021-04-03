import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { ProductPricingDirector } from 'meteor/unchained:core-pricing';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { DeliveryProviders } from 'meteor/unchained:core-delivery';
import { Countries } from 'meteor/unchained:core-countries';
import {
  findLocalizedText,
  objectInvert,
  findUnusedSlug,
} from 'meteor/unchained:utils';

import { Locale } from 'locale';
import crypto from 'crypto';

import { log } from 'meteor/unchained:core-logger';
import { Products, ProductTexts } from './collections';
import { ProductVariations } from '../product-variations/collections';
import { ProductMedia, Media } from '../product-media/collections';
import { ProductReviews } from '../product-reviews/collections';

import { ProductStatus, ProductTypes } from './schema';

const getPriceLevels = (product, { currencyCode, countryCode }) => {
  return (product?.commerce?.pricing || [])
    .sort(
      (
        { maxQuantity: leftMaxQuantity = 0 },
        { maxQuantity: rightMaxQuantity = 0 }
      ) => {
        if (
          leftMaxQuantity === rightMaxQuantity ||
          (!leftMaxQuantity && !rightMaxQuantity)
        )
          return 0;
        if (leftMaxQuantity === 0) return 1;
        if (rightMaxQuantity === 0) return -1;
        return leftMaxQuantity - rightMaxQuantity;
      }
    )
    .filter(
      (priceLevel) =>
        priceLevel.currencyCode === currencyCode &&
        priceLevel.countryCode === countryCode
    );
};

const getPriceRange = (prices) => {
  const { min, max } = prices.reduce(
    (m, current) => {
      return {
        min: current.amount < m.min.amount ? current : m.min,
        max: current.amount > m.max.amount ? current : m.max,
      };
    },
    {
      min: { ...prices[0] },
      max: { ...prices[0] },
    }
  );

  return {
    minPrice: {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            min?.isTaxable,
            min?.isNetPrice,
            min?.amount,
            min?.currencyCode,
          ].join('')
        )
        .digest('hex'),
      isTaxable: !!min?.isTaxable,
      isNetPrice: !!min?.isNetPrice,
      amount: Math.round(min?.amount),
      currencyCode: min?.currencyCode,
    },
    maxPrice: {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            max?.isTaxable,
            max?.isNetPrice,
            max?.amount,
            max?.currencyCode,
          ].join('')
        )
        .digest('hex'),
      isTaxable: !!max?.isTaxable,
      isNetPrice: !!max?.isNetPrice,
      amount: Math.round(max?.amount),
      currencyCode: max?.currencyCode,
    },
  };
};

Products.productExists = ({ productId, slug }) => {
  const selector = productId ? { _id: productId } : { slugs: slug };
  return !!Products.find(selector, { limit: 1 }).count();
};

Products.findProduct = ({ productId, slug }) => {
  const selector = productId ? { _id: productId } : { slugs: slug };
  return Products.findOne(selector);
};

Products.findProducts = ({
  limit,
  offset,
  tags,
  includeDrafts,
  slugs,
  sort = { sequence: 1, published: -1 },
}) => {
  const selector = {};
  const options = { sort };

  log(
    `hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh ${JSON.stringify(
      process.env.NODE_ENV
    )}`
  );

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else {
    options.skip = offset;
    options.limit = limit;

    if (tags?.length > 0) {
      selector.tags = { $all: tags };
    }
  }
  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  return Products.find(selector, options).fetch();
};

Products.count = async ({ tags, includeDrafts, slugs }) => {
  const selector = {};

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (tags?.length > 0) {
    selector.tags = { $all: tags };
  }
  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  const count = await Products.rawCollection().countDocuments(selector);
  return count;
};

Products.createProduct = (
  { locale, title, type, sequence, authorId, ...productData },
  { autopublish = false } = {}
) => {
  const productId = Products.insert({
    created: new Date(),
    type: ProductTypes[type],
    status: ProductStatus.DRAFT,
    sequence: sequence ?? Products.find({}).count() + 10,
    authorId,
    ...productData,
  });
  const product = Products.findOne({ _id: productId });
  if (locale) {
    product.upsertLocalizedText(locale, { title, authorId });
    if (autopublish) {
      product.publish();
    }
  }
  return product;
};

Products.updateProduct = ({ productId, type, ...product }) => {
  const modifier = {
    $set: {
      ...product,
      updated: new Date(),
    },
  };
  if (type) {
    modifier.$set.type = ProductTypes[type];
  }
  return Products.update({ _id: productId }, modifier);
};
ProductTexts.findProductTexts = ({ productId }) => {
  return ProductTexts.find({ productId }).fetch();
};

ProductTexts.makeSlug = ({ slug, title, productId }, options) => {
  const checkSlugIsUnique = (newPotentialSlug) => {
    return (
      ProductTexts.find({
        productId: { $ne: productId },
        slug: newPotentialSlug,
      }).count() === 0
    );
  };
  return findUnusedSlug(
    checkSlugIsUnique,
    options
  )({
    existingSlug: slug,
    title: title || productId,
  });
};

Products.addProxyAssignment = ({ productId, proxyId, vectors }) => {
  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $push: {
      'proxy.assignments': {
        vector,
        productId,
      },
    },
  };

  return Products.update({ _id: proxyId }, modifier);
};

Products.createBundleItem = ({ productId, item }) => {
  return Products.update(
    { _id: productId },
    {
      $set: {
        updated: new Date(),
      },
      $push: {
        bundleItems: item,
      },
    }
  );
};

Products.removeBundleItem = ({ productId, index }) => {
  // TODO: There has to be a better MongoDB way to do this!
  const product = Products.findOne({ _id: productId });
  const { bundleItems = [] } = product;
  bundleItems.splice(index, 1);

  return Products.update(
    { _id: productId },
    {
      $set: {
        updated: new Date(),
        bundleItems,
      },
    }
  );
};

Products.removeProduct = ({ productId }) => {
  const product = Products.findOne({ _id: productId });
  switch (product.status) {
    case ProductStatus.DRAFT:
      Products.update(
        { _id: productId },
        {
          $set: {
            status: ProductStatus.DELETED,
            updated: new Date(),
          },
        }
      );
      break;
    default:
      throw new Error(`Invalid status', ${this.status}`);
  }
};

Products.removeAssignment = ({ productId, vectors }) => {
  const vector = {};
  vectors.forEach(({ key, value }) => {
    vector[key] = value;
  });
  const modifier = {
    $set: {
      updated: new Date(),
    },
    $pull: {
      'proxy.assignments': {
        vector,
      },
    },
  };
  Products.update({ _id: productId }, modifier, { multi: true });
};

Products.helpers({
  publish() {
    switch (this.status) {
      case ProductStatus.DRAFT:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.ACTIVE,
              updated: new Date(),
              published: new Date(),
            },
          }
        );
        return true;
      default:
        return false;
    }
  },
  unpublish() {
    switch (this.status) {
      case ProductStatus.ACTIVE:
        Products.update(
          { _id: this._id },
          {
            $set: {
              status: ProductStatus.DRAFT,
              updated: new Date(),
              published: null,
            },
          }
        );
        return true;
      default:
        return false;
    }
  },
  upsertLocalizedText(locale, { slug: forcedSlug, title = null, ...fields }) {
    const slug = ProductTexts.makeSlug({
      slug: forcedSlug,
      title,
      productId: this._id,
    });
    const modifier = {
      $set: {
        updated: new Date(),
        title,
        ...fields,
      },
      $setOnInsert: {
        created: new Date(),
        productId: this._id,
        locale,
      },
    };
    if (forcedSlug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }
    const { insertedId, numberAffected } = ProductTexts.upsert(
      {
        productId: this._id,
        locale,
      },
      modifier
    );

    if (insertedId || numberAffected) {
      Products.update(
        {
          _id: this._id,
        },
        {
          $set: {
            updated: new Date(),
          },
          $addToSet: {
            slugs: slug,
          },
        }
      );
      Products.update(
        {
          _id: { $ne: this._id },
          slugs: slug,
        },
        {
          $set: {
            updated: new Date(),
          },
          $pullAll: {
            slugs: slug,
          },
        },
        { multi: true }
      );
    }
    return ProductTexts.findOne(
      insertedId ? { _id: insertedId } : { productId: this._id, locale }
    );
  },
  updateTexts({ texts, userId }) {
    return texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
      })
    );
  },
  addMediaLink(mediaData) {
    return ProductMedia.createMedia({
      productId: this._id,
      ...mediaData,
    });
  },
  addMedia({
    rawFile,
    href,
    name,
    authorId,
    meta,
    tags = [],
    sortKey,
    ...options
  }) {
    const fileLoader = rawFile
      ? Media.insertWithRemoteFile({
          file: rawFile,
          userId: authorId,
        })
      : Media.insertWithRemoteURL({
          url: href,
          fileName: name,
          userId: authorId,
          ...options,
        });
    const file = Promise.await(fileLoader);
    return this.addMediaLink({
      mediaId: file._id,
      tags,
      meta,
      authorId,
      sortKey,
    });
  },
  getLocalizedTexts(locale) {
    const parsedLocale = new Locale(locale);
    return Products.getLocalizedTexts(this._id, parsedLocale);
  },
  normalizedStatus() {
    return objectInvert(ProductStatus)[this.status || null];
  },
  media({ limit, offset, tags }) {
    const selector = { productId: this._id };
    if (tags && tags.length > 0) {
      selector.tags = { $all: tags };
    }
    return ProductMedia.find(selector, {
      skip: offset,
      limit,
      sort: { sortKey: 1 },
    }).fetch();
  },
  variations() {
    return ProductVariations.find({ productId: this._id }).fetch();
  },
  variation(key) {
    return ProductVariations.findOne({ productId: this._id, key });
  },
  proxyAssignments({ includeInactive = false } = {}) {
    const assignments = this.proxy?.assignments || [];

    const productIds = assignments.map(({ productId }) => productId);
    const selector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    const supportedProductIds = Products.find(selector, {
      fields: { _id: 1 },
    })
      .fetch()
      .map(({ _id }) => _id);

    return assignments
      .filter(({ productId }) => {
        return supportedProductIds.includes(productId);
      })
      .map((assignment) => ({
        assignment,
        product: this,
      }));
  },
  proxyProducts(vectors, { includeInactive = false } = {}) {
    const { proxy = {} } = this;
    let filtered = [...(proxy.assignments || [])];

    vectors.forEach(({ key, value }) => {
      filtered = filtered.filter((assignment) => {
        if (assignment.vector[key] === value) {
          return true;
        }
        return false;
      });
    });
    const productIds = filtered.map(
      (filteredAssignment) => filteredAssignment.productId
    );
    const selector = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    return Products.find(selector).fetch();
  },
  userDispatches({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const dispatch = warehousingProvider.estimatedDispatch(context);
            return {
              ...context,
              ...dispatch,
            };
          })
        ),
      []
    );
  },

  userStocks({ deliveryProviderType, ...options }, requestContext) {
    const deliveryProviders = DeliveryProviders.findProviders({
      type: deliveryProviderType,
    });
    return deliveryProviders.reduce(
      (oldResult, deliveryProvider) =>
        oldResult.concat(
          oldResult,
          WarehousingProviders.findSupported({
            product: this,
            deliveryProvider,
          }).map((warehousingProvider) => {
            const context = {
              warehousingProvider,
              deliveryProvider,
              product: this,
              requestContext,
              ...options,
            };
            const stock = warehousingProvider.estimatedStock(context);
            return {
              ...context,
              ...stock,
            };
          })
        ),
      []
    );
  },

  userDiscounts(/* { quantity, country, userId }, requestContext */) {
    // TODO: User Discount Simulation
    return [];
  },

  userPrice(
    { quantity = 1, country, currency, user, useNetPrice },
    requestContext
  ) {
    const currencyCode =
      currency ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: country,
      });

    const pricingDirector = new ProductPricingDirector({
      product: this,
      user,
      country,
      currency: currencyCode,
      quantity,
      requestContext,
    });

    const calculated = pricingDirector.calculate();
    if (!calculated) return null;

    const pricing = pricingDirector.resultSheet();
    const userPrice = pricing.unitPrice({ useNetPrice });
    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            country,
            quantity,
            useNetPrice,
            user ? user._id : 'ANONYMOUS',
          ].join('')
        )
        .digest('hex'),
      amount: userPrice.amount,
      currencyCode: userPrice.currency,
      isTaxable: pricing.taxSum() > 0,
      isNetPrice: useNetPrice,
    };
  },
  price({ country: countryCode, currency: forcedCurrencyCode, quantity = 1 }) {
    const currencyCode =
      forcedCurrencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      });

    const pricing = getPriceLevels(this, {
      currencyCode,
      countryCode,
    });
    const foundPrice = pricing.find(
      (level) => !level.maxQuantity || level.maxQuantity >= quantity
    );

    const price = {
      amount: null,
      currencyCode,
      countryCode,
      isTaxable: false,
      isNetPrice: false,
      ...foundPrice,
    };

    if (price.amount !== undefined && price.amount !== null) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([this._id, countryCode, currencyCode].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  },
  resolveOrderableProduct({ configuration = [] }) {
    this.checkIsActive();
    if (this.type === ProductTypes.ConfigurableProduct) {
      const variations = this.variations();
      const vectors = configuration.filter(({ key: configurationKey }) => {
        const isKeyEqualsVariationKey = Boolean(
          variations.filter(
            ({ key: variationKey }) => variationKey === configurationKey
          ).length
        );
        return isKeyEqualsVariationKey;
      });
      const variants = this.proxyProducts(vectors);
      if (variants.length !== 1) {
        throw new Error(
          'There needs to be exactly one variant left when adding a ConfigurableProduct to the cart, configuration not distinct enough'
        );
      }
      const resolvedProduct = variants[0];
      resolvedProduct.checkIsActive();
      return resolvedProduct;
    }
    return this;
  },
  checkIsActive() {
    if (!this.isActive()) {
      throw new Error(
        'This product is not available for ordering at the moment'
      );
    }
  },
  isActive() {
    if (this.status === ProductStatus.ACTIVE) return true;
    return false;
  },
  reviews({ limit, offset }) {
    return ProductReviews.findReviews(
      { productId: this._id },
      { offset, limit }
    );
  },
  catalogPrices() {
    const prices = (this.commerce && this.commerce.pricing) || [];
    return prices.map((price) => ({
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            price.countryCode,
            price.currencyCode,
            price.maxQuantity,
            price.amount,
          ].join('')
        )
        .digest('hex'),
      ...price,
    }));
  },
  catalogPriceRange({
    quantity = 0,
    vectors = [],
    includeInactive = false,
    country,
    currency,
  }) {
    const proxyProducts = this.proxyProducts(vectors, { includeInactive });
    const filtered = [];
    proxyProducts.forEach((p) => {
      const catalogPrice = p.price({
        country,
        quantity,
        currency,
      });

      if (catalogPrice) {
        filtered.push(catalogPrice);
      }
    });

    if (!filtered.length) return null;
    const { minPrice, maxPrice } = getPriceRange(filtered);

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            Math.random(),
            minPrice.amount,
            minPrice.currency,
            maxPrice.amount,
            maxPrice.currency,
          ].join('')
        )
        .digest('hex'),
      minPrice,
      maxPrice,
    };
  },
  simulatedPriceRange(
    {
      quantity,
      vectors = [],
      includeInactive = false,
      currency,
      country,
      useNetPrice = false,
    },
    requestContext
  ) {
    const proxyProducts = this.proxyProducts(vectors, { includeInactive });
    const { userId, user } = requestContext;
    const filtered = [];

    proxyProducts.forEach((p) => {
      const userPrice = p.userPrice(
        {
          quantity,
          currency,
          country,
          useNetPrice,
          userId,
          user,
        },
        requestContext
      );
      if (userPrice) filtered.push(userPrice);
    });

    if (!filtered.length) return null;
    const { minPrice, maxPrice } = getPriceRange(filtered);

    return {
      _id: crypto
        .createHash('sha256')
        .update(
          [
            this._id,
            Math.random(),
            minPrice.amount,
            minPrice.currency,
            maxPrice.amount,
            maxPrice.currency,
          ].join('')
        )
        .digest('hex'),
      minPrice,
      maxPrice,
    };
  },
  leveledCatalogPrices({ currency: currencyCode, country: countryCode }) {
    const currency =
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      });

    let previousMax = null;
    const filteredAndSortedPriceLevels = getPriceLevels(this, {
      currencyCode: currency,
      countryCode,
    });

    return filteredAndSortedPriceLevels.map((priceLevel, i) => {
      const max = priceLevel.maxQuantity || null;
      const min = previousMax ? previousMax + 1 : 0;
      previousMax = priceLevel.maxQuantity;
      return {
        minQuantity: min,
        maxQuantity:
          i === 0 && priceLevel.maxQuantity > 0 ? priceLevel.maxQuantity : max,
        price: {
          _id: crypto
            .createHash('sha256')
            .update([this._id, priceLevel.amount, currency].join(''))
            .digest('hex'),
          isTaxable: !!priceLevel.isTaxable,
          isNetPrice: !!priceLevel.isNetPrice,
          amount: priceLevel.amount,
          currencyCode: currency,
        },
      };
    });
  },
});

Products.getLocalizedTexts = (productId, locale) =>
  findLocalizedText(ProductTexts, { productId }, locale);

const X = {
  SHELL: '/bin/bash',
  npm_config_access: '',
  npm_config_timing: '',
  SESSION_MANAGER:
    'local/starboy-pc:@/tmp/.ICE-unix/2013,unix/starboy-pc:/tmp/.ICE-unix/2013',
  npm_config_save_dev: '',
  QT_ACCESSIBILITY: '1',
  npm_config_sign_git_tag: '',
  npm_config_before: '',
  npm_config_userconfig: '/home/mike/.npmrc',
  npm_config_global: '',
  npm_config_unsafe_perm: 'true',
  COLORTERM: 'truecolor',
  npm_config_fetch_retry_mintimeout: '10000',
  XDG_CONFIG_DIRS: '/etc/xdg/xdg-ubuntu:/etc/xdg',
  npm_config_cache: '/home/mike/.npm',
  npm_config_loglevel: 'notice',
  npm_config_init_author_name: '',
  npm_config_send_metrics: '',
  NVM_INC: '/home/mike/.nvm/versions/node/v12.18.3/include/node',
  XDG_MENU_PREFIX: 'gnome-',
  npm_package_repository_url:
    'git+https://github.com/unchainedshop/unchained.git',
  npm_config_optional: 'true',
  GNOME_DESKTOP_SESSION_ID: 'this-is-deprecated',
  npm_config_user: '1000',
  npm_package_dependencies_bcrypt: '^5.0.0',
  npm_config_git_tag_version: 'true',
  npm_package_devDependencies__babel_preset_env: '^7.12.13',
  npm_package_contributors_2_email: 'maw@panter.ch',
  npm_config_rebuild_bundle: 'true',
  npm_package_devDependencies_eslint_plugin_prettier: '^3.3.1',
  npm_config_always_auth: '',
  npm_config_cache_max: 'Infinity',
  npm_package_contributors_0_email: 'vedran@unchained.shop',
  METEOR_PACKAGE_DIRS: '../../packages',
  NODE: '/home/mike/.nvm/versions/node/v12.18.3/bin/node',
  npm_config_searchstaleness: '900',
  npm_config_ignore_scripts: '',
  npm_config_save_optional: '',
  npm_package_dependencies_moment: '^2.29.1',
  npm_package_contributors_1_name: 'Pascal Kaufmann',
  LC_ADDRESS: 'am_ET',
  GNOME_SHELL_SESSION_MODE: 'ubuntu',
  LC_NAME: 'am_ET',
  SSH_AUTH_SOCK: '/run/user/1000/keyring/ssh',
  npm_config_dev: '',
  npm_config_browser: '',
  npm_config_maxsockets: '50',
  npm_package_contributors_3_email: 'simon@unchained.shop',
  npm_package_contributors_2_name: 'Marco Wettstein',
  npm_config_argv:
    '{"remain":[],"cooked":["run","dev"],"original":["run","dev"]}',
  npm_config_ham_it_up: '',
  XMODIFIERS: '@im=ibus',
  npm_config_bin_links: 'true',
  DESKTOP_SESSION: 'ubuntu',
  LC_MONETARY: 'am_ET',
  SSH_AGENT_PID: '1970',
  npm_config_allow_same_version: '',
  npm_config_globalconfig: '/home/mike/.nvm/versions/node/v12.18.3/etc/npmrc',
  npm_config_cache_min: '10',
  npm_package_devDependencies_eslint_import_resolver_meteor: '^0.4.0',
  npm_config_tag_version_prefix: 'v',
  npm_config_shell: '/bin/bash',
  npm_config_preid: '',
  npm_config_usage: '',
  GTK_MODULES: 'gail:atk-bridge',
  PWD: '/var/www/html/unchained/examples/minimal',
  npm_package_contributors_1_email: 'pascal@unchained.shop',
  npm_config_save_prefix: '^',
  npm_config_only: '',
  XDG_SESSION_DESKTOP: 'ubuntu',
  LOGNAME: 'mike',
  XDG_SESSION_TYPE: 'x11',
  npm_config_sign_git_commit: '',
  npm_package_meteor_mainModule_client: 'false',
  npm_config_commit_hooks: 'true',
  npm_config_init_module: '/home/mike/.npm-init.js',
  npm_config_otp: '',
  npm_config_editor: 'vi',
  GPG_AGENT_INFO: '/run/user/1000/gnupg/S.gpg-agent:0:1',
  npm_package_devDependencies__babel_core: '^7.12.13',
  npm_config_tmp: '/tmp',
  npm_package_scripts_build:
    'cross-env METEOR_PACKAGE_DIRS=../../packages UI_ENDPOINT=http://localhost:4000 meteor build --server-only --directory .build',
  npm_package_devDependencies_cross_env: '^7.0.3',
  npm_config_audit_level: 'low',
  npm_config_color: 'true',
  XAUTHORITY: '/run/user/1000/gdm/Xauthority',
  npm_package_devDependencies_prettier: '^2.2.1',
  npm_config_package_lock_only: '',
  npm_package_contributors_0_url: 'https://unchained.shop',
  npm_config_save_prod: '',
  npm_package_bugs_url: 'https://github.com/unchainedshop/unchained/issues',
  GJS_DEBUG_TOPICS: 'JS ERROR;JS LOG',
  WINDOWPATH: '2',
  npm_config_format_package_lock: 'true',
  UI_ENDPOINT: 'http://localhost:4000',
  npm_config_also: '',
  npm_config_cidr: '',
  HOME: '/home/mike',
  npm_config_node_version: '12.18.3',
  USERNAME: 'mike',
  IM_CONFIG_PHASE: '1',
  LC_PAPER: 'am_ET',
  LANG: 'en_US.UTF-8',
  npm_config_init_author_url: '',
  LS_COLORS:
    'rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:',
  npm_package_contributors_3_name: 'Simon Emanuel Schmid',
  XDG_CURRENT_DESKTOP: 'ubuntu:GNOME',
  npm_config_globalignorefile:
    '/home/mike/.nvm/versions/node/v12.18.3/etc/npmignore',
  npm_config_init_license: 'ISC',
  npm_package_version: '0.61.1',
  npm_config_cache_lock_stale: '60000',
  npm_package_dependencies_isomorphic_unfetch: '^3.1.0',
  VTE_VERSION: '6003',
  npm_config_versions: '',
  npm_config_proxy: '',
  npm_config_fetch_retry_maxtimeout: '60000',
  npm_config_fetch_retries: '2',
  npm_config_git: 'git',
  npm_config_group: '1000',
  npm_config_read_only: '',
  npm_package_repository_type: 'git',
  GNOME_TERMINAL_SCREEN:
    '/org/gnome/Terminal/screen/3dce24eb_5f7e_41bb_b9c1_917102e1460e',
  npm_package_contributors_3_url: 'https://unchained.shop',
  npm_package_contributors_1_url: 'https://unchained.shop',
  npm_config_unicode: 'true',
  npm_config_sso_type: 'oauth',
  npm_config_cache_lock_retries: '10',
  INVOCATION_ID: 'd570990470a749a99c1571ab1e11a3c4',
  npm_config_local_address: '',
  npm_config_description: 'true',
  MANAGERPID: '1762',
  npm_package_dependencies__paypal_checkout_server_sdk: '^1.0.2',
  INIT_CWD: '/var/www/html/unchained/examples/minimal',
  npm_config_dry_run: '',
  npm_package_devDependencies_eslint_plugin_import: '^2.22.1',
  npm_config_viewer: 'man',
  npm_config_message: '%s',
  npm_config_offline: '',
  npm_config_production: '',
  npm_config_prefer_online: '',
  npm_config_link: '',
  npm_lifecycle_script:
    "cross-env METEOR_PACKAGE_DIRS=../../packages UI_ENDPOINT=http://localhost:4000 SERVER_NODE_OPTIONS='-r ./node_env.js' meteor --exclude-archs web.browser.legacy,web.cordova,web.browser --no-release-check --no-lint -p 4010",
  npm_package_description: 'Minimal Bootstrap Project for Unchained Engine',
  GJS_DEBUG_OUTPUT: 'stderr',
  npm_config_shrinkwrap: 'true',
  NVM_DIR: '/home/mike/.nvm',
  npm_config_force: '',
  npm_config_rollback: 'true',
  LESSCLOSE: '/usr/bin/lesspipe %s %s',
  XDG_SESSION_CLASS: 'user',
  npm_config_save_bundle: '',
  npm_config_onload_script: '',
  LC_IDENTIFICATION: 'am_ET',
  TERM: 'xterm-256color',
  npm_package_name: '@unchainedshop/example-minimal',
  npm_package_dependencies__unchainedshop_controlpanel: '^0.61.1',
  npm_config_prefix: '/home/mike/.nvm/versions/node/v12.18.3',
  npm_config_cert: '',
  npm_package_meteor_mainModule_server: 'boot.js',
  LESSOPEN: '| /usr/bin/lesspipe %s',
  USER: 'mike',
  npm_package_dependencies_client_oauth2:
    'github:unchainedshop/js-client-oauth2#master',
  npm_package_dependencies__babel_runtime: '^7.12.13',
  SERVER_NODE_OPTIONS: '-r ./node_env.js',
  npm_config_heading: 'npm',
  npm_package_homepage: 'https://unchained.shop',
  GNOME_TERMINAL_SERVICE: ':1.122',
  npm_package_dependencies_apollo_server_express: '^2.21.0',
  npm_config_cache_lock_wait: '10000',
  npm_config_node_options: '',
  npm_config_key: '',
  npm_config_json: '',
  npm_config_depth: 'Infinity',
  npm_package_dependencies_dotenv_extended: '^2.9.0',
  DISPLAY: ':0',
  npm_package_devDependencies_eslint_config_airbnb_base: '^14.2.1',
  npm_lifecycle_event: 'dev',
  SHLVL: '1',
  NVM_CD_FLAGS: '',
  npm_package_dependencies_stripe: '^8.135.0',
  npm_package_devDependencies_eslint: '^7.19.0',
  LC_TELEPHONE: 'am_ET',
  npm_config_ca: '',
  npm_config_prefer_offline: '',
  QT_IM_MODULE: 'ibus',
  npm_config_fund: 'true',
  LC_MEASUREMENT: 'am_ET',
  npm_config_if_present: '',
  npm_package_dependencies_xml_js: '^1.6.11',
  npm_config_user_agent: 'npm/6.14.12 node/v12.18.3 linux x64',
  npm_package_scripts_lint: 'eslint . --cache  --fix --ext=jsx --ext=js',
  npm_config_save_exact: '',
  npm_execpath:
    '/home/mike/.nvm/versions/node/v12.18.3/lib/node_modules/npm/bin/npm-cli.js',
  npm_config_progress: 'true',
  npm_package_dependencies_simpl_schema: '^1.10.2',
  npm_package_dependencies_locale: '^0.1.0',
  npm_package_devDependencies_babel_eslint: '^10.1.0',
  npm_config_global_style: '',
  npm_config_init_author_email: '',
  XDG_RUNTIME_DIR: '/run/user/1000',
  npm_config_script_shell: '',
  npm_config_long: '',
  npm_config_save: 'true',
  npm_config_strict_ssl: 'true',
  npm_package_dependencies_graphql: '^15.5.0',
  npm_config_auth_type: 'legacy',
  npm_config_version: '',
  npm_config_logs_max: '10',
  LC_TIME: 'am_ET',
  npm_package_scripts_dev:
    "cross-env METEOR_PACKAGE_DIRS=../../packages UI_ENDPOINT=http://localhost:4000 SERVER_NODE_OPTIONS='-r ./node_env.js' meteor --exclude-archs web.browser.legacy,web.cordova,web.browser --no-release-check --no-lint -p 4010",
  npm_config_umask: '0002',
  npm_config_sso_poll_frequency: '500',
  npm_config_searchopts: '',
  npm_config_legacy_bundling: '',
  JOURNAL_STREAM: '8:46497',
  XDG_DATA_DIRS:
    '/usr/share/ubuntu:/usr/local/share/:/usr/share/:/var/lib/snapd/desktop',
  npm_config_searchlimit: '20',
  npm_config_noproxy: '',
  PATH:
    '/home/mike/.nvm/versions/node/v12.18.3/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/var/www/html/unchained/examples/minimal/node_modules/.bin:/home/mike/.nvm/versions/node/v12.18.3/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/var/www/html/unchained/node_modules/.bin:/home/mike/.nvm/versions/node/v12.18.3/lib/node_modules/npm/node_modules/npm-lifecycle/node-gyp-bin:/var/www/html/unchained/node_modules/.bin:/home/mike/.nvm/versions/node/v12.18.3/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin',
  npm_package_scripts_debug:
    "cross-env METEOR_PACKAGE_DIRS=../../packages UI_ENDPOINT=http://localhost:4000 SERVER_NODE_OPTIONS='-r ./node_env.js' meteor --exclude-archs web.browser.legacy,web.cordova,web.browser debug -p 4010",
  npm_config_metrics_registry: 'https://registry.npmjs.org/',
  npm_config_node_gyp:
    '/home/mike/.nvm/versions/node/v12.18.3/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js',
  npm_config_searchexclude: '',
  GDMSESSION: 'ubuntu',
  npm_package_dependencies_body_parser: '^1.19.0',
  npm_package_contributors_0_name: 'Vedran Rudelj',
  DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
  npm_package_license: 'EUPL-1.2',
  npm_package_dependencies_meteor_node_stubs: '^1.0.1',
  npm_config_update_notifier: 'true',
  npm_package_devDependencies__babel_register: '^7.12.13',
  NVM_BIN: '/home/mike/.nvm/versions/node/v12.18.3/bin',
  npm_config_registry: 'https://registry.npmjs.org/',
  npm_config_ignore_prepublish: '',
  npm_config_audit: 'true',
  npm_config_tag: 'latest',
  npm_config_scripts_prepend_node_path: 'warn-only',
  npm_config_cafile: '',
  npm_config_fetch_retry_factor: '10',
  npm_node_execpath: '/home/mike/.nvm/versions/node/v12.18.3/bin/node',
  npm_config_engine_strict: '',
  npm_config_https_proxy: '',
  LC_NUMERIC: 'am_ET',
  OLDPWD: '/home/mike/.meteor/packages/meteor-tool/1.12.0/mt-os.linux.x86_64',
  npm_config_scope: '',
  npm_config_package_lock: 'true',
  npm_config_parseable: '',
  npm_config_init_version: '1.0.0',
  NODE_ENV: 'development',
  PORT: '24756',
  ROOT_URL: 'http://localhost:4010/',
  MONGO_URL: 'mongodb://127.0.0.1:4011/meteor',
  MOBILE_DDP_URL: 'http://192.168.1.5:4010/',
  MOBILE_ROOT_URL: 'http://192.168.1.5:4010/',
  MONGO_OPLOG_URL: 'mongodb://127.0.0.1:4011/local',
  APP_ID: '1kpbm9f8bsdz1m73x7m',
  METEOR_AUTO_RESTART: 'true',
  HTTP_FORWARDED_COUNT: '1',
  METEOR_SHELL_DIR:
    '/var/www/html/unchained/examples/minimal/.meteor/local/shell',
  METEOR_PARENT_PID: '13231',
  METEOR_PRINT_ON_LISTEN: 'true',
  TEST_METADATA: '{}',
};

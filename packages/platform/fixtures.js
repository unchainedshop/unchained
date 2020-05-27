import { Factory } from 'meteor/dburles:factory';
import faker from 'faker';
import { createLogger } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:platform');

const addTextAndMediaToProduct = (productId, slug) => {
  faker.locale = 'de';
  logger.verbose(
    `unchained:platform -> fixtures: -> productText ${faker.locale}`
  );
  Factory.create('productText', { productId, locale: 'de', slug });
  faker.locale = 'en';
  logger.verbose(
    `unchained:platform -> fixtures: -> productText ${faker.locale}`
  );
  Factory.create('productText', { productId, locale: 'en', slug });

  // Add some random images to the product
  Array.from(Array(2)).forEach((value, sortKey) => {
    logger.verbose(
      `unchained:platform -> fixtures: -> productMedia ${sortKey}`
    );
    const productMedia = Factory.create('productMedia', { productId, sortKey });
    faker.locale = 'de';
    logger.verbose(
      `unchained:platform -> fixtures: -> productMediaText ${faker.locale}`
    );
    Factory.create('productMediaText', {
      productMediaId: productMedia._id,
      locale: 'de',
    });
    faker.locale = 'en';
    logger.verbose(
      `unchained:platform -> fixtures: -> productMediaText ${faker.locale}`
    );
    Factory.create('productMediaText', {
      productMediaId: productMedia._id,
      locale: 'en',
    });
  });
};

const addTextToAssortment = (assortmentId, slug) => {
  faker.locale = 'de';
  logger.verbose(
    `unchained:platform -> fixtures: -> assortmentTexts ${faker.locale}`
  );
  Factory.create('assortmentText', { assortmentId, locale: 'de', slug });
  faker.locale = 'en';
  logger.verbose(
    `unchained:platform -> fixtures: -> assortmentTexts ${faker.locale}`
  );
  Factory.create('assortmentText', { assortmentId, locale: 'en', slug });
};

const addVariationsToProduct = (productId) => {
  const addTranslation = (productVariationId, productVariationOptionValue) => {
    faker.locale = 'de';
    logger.verbose(
      `unchained:platform -> fixtures: --> productVariationText ${faker.locale}`
    );
    Factory.create('productVariationText', {
      productVariationId,
      locale: faker.locale,
      productVariationOptionValue,
    });
    faker.locale = 'en';
    logger.verbose(
      `unchained:platform -> fixtures: --> productVariationText ${faker.locale}`
    );
    Factory.create('productVariationText', {
      productVariationId,
      locale: faker.locale,
      productVariationOptionValue,
    });
  };
  Array.from(Array(1)).forEach(() => {
    logger.verbose('unchained:platform -> fixtures: -> productVariation');
    const productVariation = Factory.create('productVariation', { productId });
    addTranslation(productVariation._id);
    productVariation.options.forEach((productVariationOptionValue) => {
      addTranslation(productVariation._id, productVariationOptionValue);
    });
  });
};

export default () => {
  try {
    const users = Array.from(Array(10)).map(() => {
      logger.verbose('unchained:platform -> fixtures: user');
      const user = Factory.create('user');
      return user._id;
    });

    try {
      logger.verbose('unchained:platform -> fixtures: user admin@localhost');
      const admin = Factory.create('user', {
        username: 'admin',
        roles: ['admin'],
        guest: false,
        emails: [{ address: 'admin@localhost', verified: true }],
      });
      users.push(admin._id);
    } catch (e) {
      // don't care
      logger.verbose(e);
    }

    const languages = ['de', 'en'].map((code, key) => {
      logger.verbose(`unchained:platform -> fixtures: languages ${code}`);
      const isBase = key === 0;
      const language = Factory.create('language', {
        isoCode: code,
        isActive: true,
        isBase,
        authorId: faker.random.arrayElement(users),
      });
      return language.isoCode;
    });
    const currencies = ['CHF', 'USD', 'EUR'].map((code) => {
      logger.verbose(`unchained:platform -> fixtures: currency ${code}`);
      const currency = Factory.create('currency', {
        isoCode: code,
        isActive: true,
        authorId: faker.random.arrayElement(users),
      });
      return currency._id;
    });
    const countries = ['CH', 'US', 'DE'].map((code, key) => {
      logger.verbose(`unchained:platform -> fixtures: countries ${code}`);
      const isBase = key === 0;
      const country = Factory.create('country', {
        isoCode: code,
        isBase,
        isActive: true,
        authorId: faker.random.arrayElement(users),
        defaultCurrencyId: currencies[key],
      });
      return country.isoCode;
    });
    const paymentProviders = Array.from(Array(1)).map(() => {
      logger.verbose('unchained:platform -> fixtures: paymentProvider');
      const paymentProvider = Factory.create('paymentProvider');
      return paymentProvider._id;
    });
    const deliveryProviders = Array.from(Array(1)).map(() => {
      logger.verbose('unchained:platform -> fixtures: deliveryProvider');
      const deliveryProvider = Factory.create('deliveryProvider');
      return deliveryProvider._id;
    });
    const warehousingProviders = Array.from(Array(1)).map(() => {
      logger.verbose('unchained:platform -> fixtures: warehousingProvider');
      const warehousingProvider = Factory.create('warehousingProvider');
      return warehousingProvider._id;
    });

    const simpleProducts = Array.from(Array(2)).map(() => {
      // Add a product
      logger.verbose('unchained:platform -> fixtures: simpleProduct');
      const product = Factory.create('simpleProduct', {
        authorId: faker.random.arrayElement(users),
      });
      addTextAndMediaToProduct(product._id, product.slugs[0]);
      return product._id;
    });

    const logs = Array.from(Array(5)).map(() => {
      // Add a product
      logger.verbose('unchained:platform -> fixtures: log');
      const logEntry = Factory.create('log', {
        meta: { userId: faker.random.arrayElement(users) },
      });
      return logEntry._id;
    });

    const configurableProducts = Array.from(Array(2)).map(() => {
      // Add a product
      logger.verbose('unchained:platform -> fixtures: configurableProduct');
      const product = Factory.create('configurableProduct', {
        authorId: faker.random.arrayElement(users),
      });
      addTextAndMediaToProduct(product._id, product.slugs[0]);
      addVariationsToProduct(product._id);
      return product._id;
    });

    const filters = Array.from(Array(1)).map(() => {
      logger.verbose('unchained:platform -> fixtures: -> filter');
      const addTranslation = (filterId, filterOptionValue) => {
        faker.locale = 'de';
        logger.verbose(
          `unchained:platform -> fixtures: --> filterText ${faker.locale}`
        );
        Factory.create('filterText', {
          filterId,
          locale: faker.locale,
          filterOptionValue,
        });
        faker.locale = 'en';
        logger.verbose(
          `unchained:platform -> fixtures: --> filterText ${faker.locale}`
        );
        Factory.create('filterText', {
          filterId,
          locale: faker.locale,
          filterOptionValue,
        });
      };
      const filter = Factory.create('filter');
      addTranslation(filter._id);
      filter.options.forEach((filterOptionValue) => {
        addTranslation(filter._id, filterOptionValue);
      });
      return filter._id;
    });

    const assortments = Array.from(Array(3)).map(() => {
      // Add a product
      logger.verbose('unchained:platform -> fixtures: assortments');
      const assortment = Factory.create('assortment');
      addTextToAssortment(assortment._id, assortment.slugs[0]);

      logger.verbose('unchained:platform -> fixtures: -> assortmentProduct');
      Array.from(Array(5)).forEach(() => {
        Factory.create('assortmentProduct', {
          assortmentId: assortment._id,
          productId: faker.random.arrayElement(simpleProducts),
        });
      });

      Factory.create('assortmentFilter', {
        assortmentId: assortment._id,
        filterId: faker.random.arrayElement(filters),
      });

      return assortment._id;
    });

    logger.verbose('unchained:platform -> fixtures: assortmentLinks');
    Factory.create('assortmentLink', {
      childAssortmentId: assortments[1],
      parentAssortmentId: assortments[0],
    });
    Factory.create('assortmentLink', {
      childAssortmentId: assortments[2],
      parentAssortmentId: assortments[0],
    });

    const orders = Array.from(Array(5)).map(() => {
      // Add an order
      logger.verbose('unchained:platform -> fixtures: order');
      const order = Factory.create('order', {
        userId: faker.random.arrayElement(users),
      });

      logger.verbose('unchained:platform -> fixtures: -> orderPayment');
      const orderPayment = Factory.create('orderPayment', {
        orderId: order._id,
        paymentProviderId: faker.random.arrayElement(paymentProviders),
      });
      logger.verbose('unchained:platform -> fixtures: -> orderDelivery');
      const orderDelivery = Factory.create('orderDelivery', {
        orderId: order._id,
        deliveryProviderId: faker.random.arrayElement(deliveryProviders),
      });

      order.setPaymentProvider({ _id: orderPayment.paymentProviderId });
      order.setDeliveryProvider({ _id: orderDelivery.deliveryProviderId });

      // Add some random images to the order
      Array.from(Array(faker.random.number({ min: 1, max: 3 }))).forEach(() => {
        logger.verbose('unchained:platform -> fixtures: -> orderPosition');
        Factory.create('orderPosition', {
          orderId: order._id,
          productId: faker.random.arrayElement([
            ...simpleProducts,
            ...configurableProducts,
          ]),
        });
      });
      return order._id;
    });

    return {
      users,
      logs,
      languages,
      countries,
      simpleProducts,
      configurableProducts,
      filters,
      orders,
      currencies,
      paymentProviders,
      deliveryProviders,
      warehousingProviders,
      assortments,
    };
  } catch (anyError) {
    logger.error(anyError);
  }
  return null;
};

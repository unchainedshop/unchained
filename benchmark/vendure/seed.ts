import { bootstrap, defaultConfig } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
import { ConnectionOptions } from 'typeorm';
import { faker } from '@faker-js/faker';
import path from 'path';
import fs from 'fs';

// Define color palette
const colorPalette = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 
  'White', 'Purple', 'Orange', 'Pink', 'Brown',
  'Gray', 'Cyan', 'Magenta', 'Lime', 'Teal'
];

/**
 * This function is used to create a benchmark dataset for Vendure
 * with 20,000 products and a category structure as specified.
 */
async function seedBenchmarkData() {
  const { app, server } = await bootstrap({
    ...defaultConfig,
    apiOptions: {
      port: 3000,
      adminApiPath: 'admin-api',
      shopApiPath: 'shop-api',
      cors: true,
    },
    authOptions: {
      tokenMethod: 'bearer',
      superadminCredentials: {
        identifier: process.env.SUPERADMIN_USERNAME || 'admin',
        password: process.env.SUPERADMIN_PASSWORD || 'admin',
      },
      requireVerification: false,
    },
    dbConnectionOptions: {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'vendure',
      synchronize: true,
      logging: false,
    } as ConnectionOptions,
    plugins: [
      AssetServerPlugin.init({
        route: 'assets',
        assetUploadDir: path.join(__dirname, '../static/assets'),
      }),
      AdminUiPlugin.init({
        route: 'admin',
        port: 3002,
      }),
      EmailPlugin.init({
        transport: {
          type: 'smtp',
          host: process.env.SMTP_HOST || 'mailcrab',
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 1025,
          auth: {
            user: process.env.SMTP_USER || 'noreply@localhost',
            pass: process.env.SMTP_PASS || 'noreply',
          },
        },
        handlers: defaultConfig.plugins?.find(
          p => p.constructor.name === 'EmailPlugin'
        )?.options.handlers,
        templatePath: defaultConfig.plugins?.find(
          p => p.constructor.name === 'EmailPlugin'
        )?.options.templatePath,
        globalTemplateVars: {
          fromAddress: process.env.SMTP_FROM || 'noreply@localhost',
        },
      }),
    ],
  });

  const ctx = await server.app.getQueryContext();
  const connection = server.app.get('TransactionalConnection');
  const productService = server.app.get('ProductService');
  const facetService = server.app.get('FacetService');
  const facetValueService = server.app.get('FacetValueService');
  const collectionService = server.app.get('CollectionService');
  const assetService = server.app.get('AssetService');
  const channelService = server.app.get('ChannelService');
  const taxCategoryService = server.app.get('TaxCategoryService');
  const taxRateService = server.app.get('TaxRateService');
  const shippingMethodService = server.app.get('ShippingMethodService');
  const paymentMethodService = server.app.get('PaymentMethodService');
  const countryService = server.app.get('CountryService');
  const zoneService = server.app.get('ZoneService');
  const currencyService = server.app.get('CurrencyService');

  // Check if already seeded
  const products = await productService.findAll(ctx, {
    take: 1,
  });
  if (products.totalItems >= 20000) {
    console.log('Database already seeded with benchmark data');
    await server.close();
    return;
  }

  console.log('Starting benchmark data seeding...');

  // Create currencies
  console.log('Setting up currencies...');
  await currencyService.create(ctx, {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
  });
  await currencyService.create(ctx, {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
  });

  // Create zones and countries
  console.log('Setting up zones and countries...');
  const usZone = await zoneService.create(ctx, {
    name: 'US',
  });
  const chZone = await zoneService.create(ctx, {
    name: 'Switzerland',
  });

  const us = await countryService.create(ctx, {
    code: 'US',
    name: 'United States',
    enabled: true,
  });
  const ch = await countryService.create(ctx, {
    code: 'CH',
    name: 'Switzerland',
    enabled: true,
  });

  await zoneService.addMembersToZone(ctx, {
    zoneId: usZone.id,
    memberIds: [us.id],
  });
  await zoneService.addMembersToZone(ctx, {
    zoneId: chZone.id,
    memberIds: [ch.id],
  });

  // Create tax categories and rates
  console.log('Setting up tax categories and rates...');
  const standardTaxCategory = await taxCategoryService.create(ctx, {
    name: 'Standard',
  });

  await taxRateService.create(ctx, {
    name: 'US Tax',
    enabled: true,
    value: 0,
    categoryId: standardTaxCategory.id,
    zoneId: usZone.id,
  });
  await taxRateService.create(ctx, {
    name: 'CH Tax',
    enabled: true,
    value: 0,
    categoryId: standardTaxCategory.id,
    zoneId: chZone.id,
  });

  // Create shipping methods
  console.log('Setting up shipping methods...');
  await shippingMethodService.create(ctx, {
    code: 'standard-shipping',
    fulfillmentHandler: 'manual-fulfillment',
    checker: {
      code: 'default-shipping-eligibility-checker',
      arguments: [{ name: 'orderMinimum', value: '0' }],
    },
    calculator: {
      code: 'default-shipping-calculator',
      arguments: [
        { name: 'rate', value: '0' },
        { name: 'taxRate', value: '0' },
      ],
    },
    translations: [
      {
        languageCode: 'en',
        name: 'Standard Shipping',
        description: 'Standard Shipping',
      },
    ],
  });

  // Create payment methods
  console.log('Setting up payment methods...');
  await paymentMethodService.create(ctx, {
    name: 'Invoice',
    code: 'invoice',
    description: 'Pay by invoice',
    enabled: true,
    handler: {
      code: 'manual-payment-handler',
      arguments: [],
    },
  });

  // Create facets for product filtering
  console.log('Creating facets for product filtering...');
  const colorFacet = await facetService.create(ctx, {
    isPrivate: false,
    code: 'color',
    translations: [
      {
        languageCode: 'en',
        name: 'Color',
      },
    ],
  });

  const colorFacetValues = await Promise.all(
    colorPalette.map(async (color) => {
      return facetValueService.create(ctx, {
        facetId: colorFacet.id,
        code: color.toLowerCase(),
        translations: [
          {
            languageCode: 'en',
            name: color,
          },
        ],
      });
    })
  );

  const sizeFacet = await facetService.create(ctx, {
    isPrivate: false,
    code: 'size',
    translations: [
      {
        languageCode: 'en',
        name: 'Size',
      },
    ],
  });

  const sizeFacetValues = await Promise.all(
    Array.from({ length: 10 }, (_, i) => i + 1).map(async (size) => {
      return facetValueService.create(ctx, {
        facetId: sizeFacet.id,
        code: `size-${size}`,
        translations: [
          {
            languageCode: 'en',
            name: size.toString(),
          },
        ],
      });
    })
  );

  // Create category structure
  console.log('Creating category structure...');
  const leafCollections = [];

  // Create 5 root categories
  for (let i = 0; i < 5; i++) {
    const rootName = `Category ${i + 1}`;
    const rootCollection = await collectionService.create(ctx, {
      isPrivate: false,
      translations: [
        {
          languageCode: 'en',
          name: rootName,
          slug: faker.helpers.slugify(rootName).toLowerCase(),
        },
      ],
      filters: [],
    });

    // Create 10 sub-categories for each root
    for (let j = 0; j < 10; j++) {
      const subName = `${rootName} - Subcategory ${j + 1}`;
      const subCollection = await collectionService.create(ctx, {
        isPrivate: false,
        parentId: rootCollection.id,
        translations: [
          {
            languageCode: 'en',
            name: subName,
            slug: faker.helpers.slugify(subName).toLowerCase(),
          },
        ],
        filters: [],
      });

      // Create 10 sub-sub-categories for each sub-category
      for (let k = 0; k < 10; k++) {
        const subSubName = `${subName} - Subcategory ${k + 1}`;
        const subSubCollection = await collectionService.create(ctx, {
          isPrivate: false,
          parentId: subCollection.id,
          translations: [
            {
              languageCode: 'en',
              name: subSubName,
              slug: faker.helpers.slugify(subSubName).toLowerCase(),
            },
          ],
          filters: [],
        });

        leafCollections.push(subSubCollection);
      }
    }
  }

  console.log(`Created ${leafCollections.length} leaf categories`);

  // Create products
  console.log('Creating 20,000 products...');
  const TOTAL_PRODUCTS = 20000;
  const BATCH_SIZE = 100;

  const defaultChannel = await channelService.getDefaultChannel(ctx);
  const taxCategory = await taxCategoryService.findAll(ctx).then(res => res.items[0]);

  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);
    const promises = [];

    for (let j = 0; j < batchSize; j++) {
      promises.push(createRandomProduct(
        ctx,
        productService,
        assetService,
        collectionService,
        facetValueService,
        leafCollections,
        colorFacetValues,
        sizeFacetValues,
        defaultChannel.id,
        taxCategory.id
      ));
    }

    await Promise.all(promises);
    console.log(`Created products ${i + 1} to ${i + batchSize} of ${TOTAL_PRODUCTS}`);
  }

  console.log(`
    Benchmark data seeding completed:
    \nProducts: 20,000
    \nCategories: ${leafCollections.length} (5 root, 50 sub, 500 sub-sub)
    \nCurrencies: USD, CHF
    \nCountries: United States, Switzerland
    \nAdmin User: ${process.env.SUPERADMIN_USERNAME || 'admin'} / ${process.env.SUPERADMIN_PASSWORD || 'admin'}
  `);

  await server.close();
}

/**
 * Helper function to create a random product
 */
async function createRandomProduct(
  ctx,
  productService,
  assetService,
  collectionService,
  facetValueService,
  leafCollections,
  colorFacetValues,
  sizeFacetValues,
  channelId,
  taxCategoryId
) {
  // Generate random product data
  const title = faker.commerce.productName();
  const subtitle = faker.commerce.productAdjective();
  const description = faker.lorem.paragraphs({ min: 1, max: 5 });
  const slug = faker.helpers.slugify(title).toLowerCase();
  const colorIndex = faker.number.int({ min: 0, max: colorPalette.length - 1 });
  const color = colorPalette[colorIndex];
  const size = faker.number.int({ min: 1, max: 10 });
  const brand = faker.company.name();
  const tags = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.word.sample());
  const labels = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.word.adjective());

  // Create assets (1-3 images)
  const mediaCount = faker.number.int({ min: 1, max: 3 });
  const assetIds = [];

  for (let i = 0; i < mediaCount; i++) {
    const imageUrl = `https://picsum.photos/seed/${slug}-${i}/800/600`;
    const asset = await assetService.create(ctx, {
      file: {
        url: imageUrl,
        name: `${title}-${i}.jpg`,
        type: 'image/jpeg',
      },
    });
    assetIds.push(asset.id);
  }

  // Create product
  const product = await productService.create(ctx, {
    enabled: true,
    translations: [
      {
        languageCode: 'en',
        name: title,
        slug,
        description,
        customFields: {
          subtitle,
          brand,
          labels: labels.join(', '),
        },
      },
    ],
    customFields: {
      tags: tags.join(', '),
    },
    facetValueIds: [
      colorFacetValues[colorIndex].id,
      sizeFacetValues[size - 1].id,
    ],
    assetIds,
    featuredAssetId: assetIds[0],
  });

  // Add product to a random category
  const randomCategoryIndex = faker.number.int({ min: 0, max: leafCollections.length - 1 });
  await collectionService.addProductsToCollection(ctx, {
    collectionId: leafCollections[randomCategoryIndex].id,
    productIds: [product.id],
  });

  // Create product variant
  await productService.createVariant(ctx, {
    productId: product.id,
    translations: [
      {
        languageCode: 'en',
        name: `${title} - ${color} - Size ${size}`,
      },
    ],
    sku: `${slug}-${color.toLowerCase()}-${size}`,
    price: faker.number.int({ min: 1000, max: 100000 }),
    stockOnHand: 100,
    trackInventory: true,
    taxCategoryId,
    facetValueIds: [
      colorFacetValues[colorIndex].id,
      sizeFacetValues[size - 1].id,
    ],
    assetIds,
    featuredAssetId: assetIds[0],
    customFields: {
      color,
      size: size.toString(),
    },
  });

  // Create a second price in CHF
  await productService.addOptionGroupToProduct(ctx, {
    productId: product.id,
    optionGroupId: product.optionGroups[0].id,
  });

  return product.id;
}

// Check if this script is being run directly
if (require.main === module) {
  seedBenchmarkData()
    .then(() => process.exit(0))
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

export default seedBenchmarkData;
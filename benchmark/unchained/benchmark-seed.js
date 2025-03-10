import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { UnchainedCore } from '@unchainedshop/core';
import { ProductStatus } from '@unchainedshop/core-products';
import { AssortmentStatus } from '@unchainedshop/core-assortments';
import { faker } from '@faker-js/faker';

const logger = console;
const {
  UNCHAINED_COUNTRY,
  UNCHAINED_CURRENCY,
  UNCHAINED_LANG,
  UNCHAINED_MAIL_RECIPIENT,
  UNCHAINED_SEED_PASSWORD,
  EMAIL_FROM,
} = process.env;

const seedPassword =
  UNCHAINED_SEED_PASSWORD === 'generate'
    ? crypto.randomUUID().split('-').pop()
    : UNCHAINED_SEED_PASSWORD;

// Define color palette
const colorPalette = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 
  'White', 'Purple', 'Orange', 'Pink', 'Brown',
  'Gray', 'Cyan', 'Magenta', 'Lime', 'Teal'
];

// Helper function to create a random product
const createRandomProduct = async (modules, currencies, languages, categoryIds) => {
  // Generate random product data
  const title = faker.commerce.productName();
  const subtitle = faker.commerce.productAdjective();
  const description = faker.lorem.paragraphs({ min: 1, max: 5 });
  const brand = faker.company.name();
  const tags = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.word.sample());
  const labels = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.word.adjective());
  const color = colorPalette[faker.number.int({ min: 0, max: colorPalette.length - 1 })];
  const size = faker.number.int({ min: 1, max: 10 });
  
  // Create product
  const productId = await modules.products.create({
    title,
    type: 'SimpleProduct',
    status: ProductStatus.ACTIVE,
  });

  // Add product texts
  await Promise.all(
    languages.map(async (language) => {
      await modules.products.updateTexts(
        {
          productId,
          texts: {
            title,
            subtitle,
            description,
            brand,
            labels,
            slug: faker.helpers.slugify(title).toLowerCase(),
          },
          languageId: language._id,
        }
      );
    })
  );

  // Add product commerce
  await Promise.all(
    currencies.map(async (currency) => {
      await modules.products.updateCommerceSettings({
        productId,
        commerce: {
          pricing: [
            {
              currencyCode: currency.isoCode,
              countryCode: null,
              amount: faker.number.int({ min: 1000, max: 100000 }) / 100,
              isTaxable: true,
              isNetPrice: false,
            },
          ],
        },
      });
    })
  );

  // Add product media (1-3 images)
  const mediaCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 0; i < mediaCount; i++) {
    const mediaId = await modules.files.createMediaFromUrl({
      url: `https://picsum.photos/seed/${productId}-${i}/800/600`,
      name: `${title}-${i}`,
      meta: { productId },
      userId: null,
    });

    await modules.products.addMedia({
      productId,
      mediaId,
      sortKey: i,
    });
  }

  // Add product to a random category
  const randomCategoryIndex = faker.number.int({ min: 0, max: categoryIds.length - 1 });
  await modules.assortments.addProducts({
    assortmentId: categoryIds[randomCategoryIndex],
    productIds: [productId],
  });

  // Add product tags
  await modules.products.addTags({
    productId,
    tags,
  });

  // Add custom fields
  await modules.products.updateCustomFields({
    productId,
    customFields: [
      {
        key: 'color',
        value: color,
      },
      {
        key: 'size',
        value: size.toString(),
      },
    ],
  });

  return productId;
};

// Helper function to create category structure
const createCategoryStructure = async (modules, languages) => {
  const categoryIds = [];
  
  // Create 5 root categories
  for (let i = 0; i < 5; i++) {
    const rootName = `Category ${i + 1}`;
    const rootId = await modules.assortments.create({
      isRoot: true,
      status: AssortmentStatus.ACTIVE,
    });
    
    // Add texts to root category
    await Promise.all(
      languages.map(async (language) => {
        await modules.assortments.updateTexts({
          assortmentId: rootId,
          texts: {
            title: rootName,
            slug: faker.helpers.slugify(rootName).toLowerCase(),
          },
          languageId: language._id,
        });
      })
    );
    
    // Create 10 sub-categories for each root
    for (let j = 0; j < 10; j++) {
      const subName = `${rootName} - Subcategory ${j + 1}`;
      const subId = await modules.assortments.create({
        isRoot: false,
        status: AssortmentStatus.ACTIVE,
      });
      
      // Add texts to sub-category
      await Promise.all(
        languages.map(async (language) => {
          await modules.assortments.updateTexts({
            assortmentId: subId,
            texts: {
              title: subName,
              slug: faker.helpers.slugify(subName).toLowerCase(),
            },
            languageId: language._id,
          });
        })
      );
      
      // Link sub-category to root
      await modules.assortments.linkAssortments({
        parentAssortmentId: rootId,
        childAssortmentIds: [subId],
      });
      
      // Create 10 sub-sub-categories for each sub-category
      for (let k = 0; k < 10; k++) {
        const subSubName = `${subName} - Subcategory ${k + 1}`;
        const subSubId = await modules.assortments.create({
          isRoot: false,
          status: AssortmentStatus.ACTIVE,
        });
        
        // Add texts to sub-sub-category
        await Promise.all(
          languages.map(async (language) => {
            await modules.assortments.updateTexts({
              assortmentId: subSubId,
              texts: {
                title: subSubName,
                slug: faker.helpers.slugify(subSubName).toLowerCase(),
              },
              languageId: language._id,
            });
          })
        );
        
        // Link sub-sub-category to sub-category
        await modules.assortments.linkAssortments({
          parentAssortmentId: subId,
          childAssortmentIds: [subSubId],
        });
        
        // Add sub-sub-category ID to the list
        categoryIds.push(subSubId);
      }
    }
  }
  
  return categoryIds;
};

// Main seed function
export default async (unchainedAPI) => {
  const { modules } = unchainedAPI;
  try {
    // Check if already seeded
    if ((await modules.users.count({ username: 'admin' })) > 0) {
      const productsCount = await modules.products.count({});
      if (productsCount >= 20000) {
        logger.log('Database already seeded with benchmark data');
        return;
      }
    }

    logger.log('Starting benchmark data seeding...');
    
    // Create admin user
    await modules.users.createUser(
      {
        email: 'admin@unchained.local',
        guest: false,
        initialPassword: seedPassword ? true : undefined,
        password: seedPassword ? seedPassword : undefined,
        roles: ['admin'],
        username: 'admin',
      },
      { skipMessaging: true },
    );

    // Create languages
    const languageCodes = UNCHAINED_LANG 
      ? UNCHAINED_LANG.toLowerCase().split(',') 
      : ['en'];
    
    const languages = await Promise.all(
      languageCodes.map(async (code) => {
        const languageId = await modules.languages.create({
          isoCode: code,
          isActive: true,
        });
        return modules.languages.findLanguage({ languageId });
      }),
    );

    // Create currencies
    const currencyCodes = UNCHAINED_CURRENCY 
      ? UNCHAINED_CURRENCY.toUpperCase().split(',') 
      : ['USD', 'CHF'];
    
    const currencies = await Promise.all(
      currencyCodes.map(async (code) => {
        const currencyId = await modules.currencies.create({
          isoCode: code,
          isActive: true,
        });
        return modules.currencies.findCurrency({
          currencyId,
        });
      }),
    );

    // Create countries
    const countryCodes = UNCHAINED_COUNTRY 
      ? UNCHAINED_COUNTRY.toUpperCase().split(',') 
      : ['US', 'CH'];
    
    await Promise.all(
      countryCodes.map(async (code, key) => {
        const countryId = await modules.countries.create({
          isoCode: code,
          isActive: true,
          defaultCurrencyCode: currencies[key % currencies.length].isoCode,
        });
        return modules.countries.findCountry({ countryId });
      }),
    );

    // Create delivery provider
    const deliveryProvider = await modules.delivery.create({
      adapterKey: 'shop.unchained.delivery.send-message',
      type: DeliveryProviderType.SHIPPING,
      configuration: [
        {
          key: 'from',
          value: EMAIL_FROM || 'noreply@localhost',
        },
        {
          key: 'to',
          value: UNCHAINED_MAIL_RECIPIENT || 'noreply@localhost',
        },
      ],
      created: new Date(),
    });

    // Create payment provider
    const paymentProvider = await modules.payment.paymentProviders.create({
      adapterKey: 'shop.unchained.invoice',
      type: PaymentProviderType.INVOICE,
      configuration: [],
      created: new Date(),
    });

    // Create category structure
    logger.log('Creating category structure...');
    const categoryIds = await createCategoryStructure(modules, languages);
    logger.log(`Created ${categoryIds.length} leaf categories`);

    // Create products
    logger.log('Creating 20,000 products...');
    const TOTAL_PRODUCTS = 20000;
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);
      const promises = [];
      
      for (let j = 0; j < batchSize; j++) {
        promises.push(createRandomProduct(modules, currencies, languages, categoryIds));
      }
      
      await Promise.all(promises);
      logger.log(`Created products ${i + 1} to ${i + batchSize} of ${TOTAL_PRODUCTS}`);
    }

    logger.log(`
      Benchmark data seeding completed:
      \nProducts: 20,000
      \nCategories: ${categoryIds.length} (5 root, 50 sub, 500 sub-sub)
      \nCurrencies: ${currencies.map(c => c.isoCode).join(',')}
      \nLanguages: ${languages.map(l => l.isoCode).join(',')}
      \nDelivery Provider: ${deliveryProvider._id} (${deliveryProvider.adapterKey})
      \nPayment Provider: ${paymentProvider._id} (${paymentProvider.adapterKey})
      \nAdmin User: admin@unchained.local / ${seedPassword}
    `);
  } catch (e) {
    logger.error('Error seeding benchmark data:', e);
  }
};
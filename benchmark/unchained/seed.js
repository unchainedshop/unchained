import { faker } from '@faker-js/faker';

// Constants from environment variables or defaults
const PRODUCT_COUNT = parseInt(process.env.PRODUCT_COUNT || '20000', 10);
const CATEGORY_ROOT_COUNT = parseInt(process.env.CATEGORY_ROOT_COUNT || '5', 10);
const CATEGORY_SUB_COUNT = parseInt(process.env.CATEGORY_SUB_COUNT || '10', 10);
const CATEGORY_SUB_SUB_COUNT = parseInt(process.env.CATEGORY_SUB_SUB_COUNT || '10', 10);
const PRODUCTS_PER_CATEGORY = parseInt(process.env.PRODUCTS_PER_CATEGORY || '40', 10);

// Predefined color palette
const COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 
  'White', 'Purple', 'Orange', 'Pink', 'Brown',
  'Gray', 'Cyan', 'Magenta', 'Lime', 'Teal',
  'Indigo', 'Violet', 'Gold', 'Silver', 'Bronze'
];

// Generate a random number of media items (1-3)
const generateMediaItems = async (modules, productId) => {
  const mediaCount = faker.number.int({ min: 1, max: 3 });
  const mediaItems = [];

  for (let i = 0; i < mediaCount; i++) {
    const width = faker.number.int({ min: 800, max: 1200 });
    const height = faker.number.int({ min: 600, max: 900 });
    const fileId = await modules.files.createFile({
      name: `product-${productId}-image-${i + 1}.jpg`,
      size: faker.number.int({ min: 10000, max: 500000 }),
      type: 'image/jpeg',
      url: `https://picsum.photos/id/${faker.number.int({ min: 1, max: 1000 })}/${width}/${height}`,
    });

    const mediaId = await modules.products.media.create({
      mediaId: fileId,
      productId,
      tags: ['gallery'],
      sortKey: i,
    });

    mediaItems.push(mediaId);
  }

  return mediaItems;
};

// Create a product with all required fields
const createProduct = async (modules, categoryIds) => {
  // Create product
  const productId = await modules.products.create({
    type: 'SimpleProduct',
    title: faker.commerce.productName(),
    specification: {
      color: faker.helpers.arrayElement(COLORS),
      size: faker.number.int({ min: 1, max: 10 }).toString(),
    },
  });

  // Add product texts
  await modules.products.texts.updateTexts({
    productId,
    locale: 'en',
    title: faker.commerce.productName(),
    subtitle: faker.commerce.productAdjective(),
    description: faker.lorem.paragraphs({ min: 1, max: 5 }),
    brand: faker.company.name(),
    labels: [faker.commerce.productAdjective(), faker.commerce.productAdjective()],
    tags: [faker.commerce.productMaterial(), faker.commerce.department()],
  });

  // Add product prices
  await modules.products.prices.updatePrice({
    productId,
    currencyCode: 'USD',
    amount: faker.number.int({ min: 1000, max: 100000 }),
    isTaxable: true,
    isNetPrice: true,
  });

  await modules.products.prices.updatePrice({
    productId,
    currencyCode: 'CHF',
    amount: faker.number.int({ min: 1000, max: 100000 }),
    isTaxable: true,
    isNetPrice: true,
  });

  // Add product media
  await generateMediaItems(modules, productId);

  // Add product to categories
  for (const categoryId of categoryIds) {
    await modules.assortments.addProduct({
      assortmentId: categoryId,
      productId,
    });
  }

  return productId;
};

// Create a category tree
const createCategoryTree = async (modules) => {
  const rootCategories = [];
  const allLeafCategories = [];

  // Create root categories
  for (let i = 0; i < CATEGORY_ROOT_COUNT; i++) {
    const rootCategoryId = await modules.assortments.create({
      isActive: true,
      isRoot: true,
      sequence: i,
    });

    await modules.assortments.texts.updateTexts({
      assortmentId: rootCategoryId,
      locale: 'en',
      title: `Root Category ${i + 1}`,
      subtitle: faker.commerce.department(),
    });

    rootCategories.push(rootCategoryId);

    // Create sub-categories
    for (let j = 0; j < CATEGORY_SUB_COUNT; j++) {
      const subCategoryId = await modules.assortments.create({
        isActive: true,
        isRoot: false,
        sequence: j,
      });

      await modules.assortments.texts.updateTexts({
        assortmentId: subCategoryId,
        locale: 'en',
        title: `Sub Category ${i + 1}-${j + 1}`,
        subtitle: faker.commerce.productAdjective(),
      });

      // Link to parent
      await modules.assortments.addLink({
        parentAssortmentId: rootCategoryId,
        childAssortmentId: subCategoryId,
      });

      // Create sub-sub-categories
      for (let k = 0; k < CATEGORY_SUB_SUB_COUNT; k++) {
        const subSubCategoryId = await modules.assortments.create({
          isActive: true,
          isRoot: false,
          sequence: k,
        });

        await modules.assortments.texts.updateTexts({
          assortmentId: subSubCategoryId,
          locale: 'en',
          title: `Sub-Sub Category ${i + 1}-${j + 1}-${k + 1}`,
          subtitle: faker.commerce.productAdjective(),
        });

        // Link to parent
        await modules.assortments.addLink({
          parentAssortmentId: subCategoryId,
          childAssortmentId: subSubCategoryId,
        });

        // Add to leaf categories
        allLeafCategories.push(subSubCategoryId);
      }
    }
  }

  return { rootCategories, allLeafCategories };
};

// Create filters for faceting
const createFilters = async (modules) => {
  // Create color filter
  const colorFilterId = await modules.filters.create({
    key: 'color',
    type: 'SINGLE',
    options: COLORS.map((color) => ({ value: color })),
    isActive: true,
  });

  await modules.filters.texts.updateTexts({
    filterId: colorFilterId,
    locale: 'en',
    title: 'Color',
    subtitle: 'Filter by color',
  });

  // Create size filter
  const sizeFilterId = await modules.filters.create({
    key: 'size',
    type: 'SINGLE',
    options: Array.from({ length: 10 }, (_, i) => ({ value: (i + 1).toString() })),
    isActive: true,
  });

  await modules.filters.texts.updateTexts({
    filterId: sizeFilterId,
    locale: 'en',
    title: 'Size',
    subtitle: 'Filter by size',
  });

  return { colorFilterId, sizeFilterId };
};

export default async function seed(unchainedAPI) {
  const { modules } = unchainedAPI;
  console.log('Starting seed process...');

  try {
    // Check if products already exist
    const existingProductsCount = await modules.products.count({});
    if (existingProductsCount > 0) {
      console.log(`Found ${existingProductsCount} existing products, skipping seed.`);
      return;
    }

    console.log('Creating category tree...');
    const { allLeafCategories } = await createCategoryTree(modules);
    console.log(`Created ${allLeafCategories.length} leaf categories.`);

    console.log('Creating filters...');
    await createFilters(modules);
    console.log('Filters created.');

    console.log(`Creating ${PRODUCT_COUNT} products...`);
    const totalProducts = PRODUCT_COUNT;
    const batchSize = 100;
    let created = 0;

    // Calculate how many products per leaf category
    const productsPerCategory = PRODUCTS_PER_CATEGORY;

    // Create products in batches
    for (let i = 0; i < allLeafCategories.length; i++) {
      const categoryId = allLeafCategories[i];
      
      // Create products for this category
      for (let j = 0; j < productsPerCategory; j++) {
        if (created >= totalProducts) break;
        
        await createProduct(modules, [categoryId]);
        created++;
        
        if (created % batchSize === 0) {
          console.log(`Created ${created}/${totalProducts} products...`);
        }
      }
      
      if (created >= totalProducts) break;
    }

    console.log(`Seed completed. Created ${created} products.`);
  } catch (error) {
    console.error('Error during seed process:', error);
    throw error;
  }
} 
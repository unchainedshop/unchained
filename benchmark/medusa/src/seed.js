const { faker } = require('@faker-js/faker');
const { ProductService, ProductVariantService, ProductCollectionService, RegionService, ShippingProfileService, ShippingOptionService, ProductCategoryService } = require('@medusajs/medusa');

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

module.exports = async (container) => {
  const productService = container.resolve('productService');
  const productVariantService = container.resolve('productVariantService');
  const productCollectionService = container.resolve('productCollectionService');
  const regionService = container.resolve('regionService');
  const shippingProfileService = container.resolve('shippingProfileService');
  const shippingOptionService = container.resolve('shippingOptionService');
  const productCategoryService = container.resolve('productCategoryService');
  const storeService = container.resolve('storeService');
  const currencyService = container.resolve('currencyService');
  const manager = container.resolve('manager');

  console.log('Starting seed process...');

  // Check if products already exist
  const existingProducts = await productService.list({}, { take: 1 });
  if (existingProducts.length > 0) {
    console.log(`Found ${existingProducts.length} existing products, skipping seed.`);
    return;
  }

  // Create regions for USD and CHF
  console.log('Creating regions...');
  const usdRegion = await regionService.create({
    name: 'USA',
    currency_code: 'usd',
    tax_rate: 0,
    payment_providers: ['manual'],
    fulfillment_providers: ['manual'],
    countries: ['us'],
  });

  const chfRegion = await regionService.create({
    name: 'Switzerland',
    currency_code: 'chf',
    tax_rate: 0,
    payment_providers: ['manual'],
    fulfillment_providers: ['manual'],
    countries: ['ch'],
  });

  // Create shipping options
  console.log('Creating shipping options...');
  const defaultProfile = await shippingProfileService.retrieveDefault();
  
  await shippingOptionService.create({
    name: 'Standard Shipping',
    region_id: usdRegion.id,
    provider_id: 'manual',
    profile_id: defaultProfile.id,
    price_type: 'flat_rate',
    amount: 500,
    data: {},
  });

  await shippingOptionService.create({
    name: 'Standard Shipping',
    region_id: chfRegion.id,
    provider_id: 'manual',
    profile_id: defaultProfile.id,
    price_type: 'flat_rate',
    amount: 500,
    data: {},
  });

  // Create category tree
  console.log('Creating category tree...');
  const rootCategories = [];
  const leafCategories = [];

  // Create root categories
  for (let i = 0; i < CATEGORY_ROOT_COUNT; i++) {
    const rootCategory = await productCategoryService.create({
      name: `Root Category ${i + 1}`,
      description: faker.commerce.department(),
      handle: `root-category-${i + 1}`,
    });

    rootCategories.push(rootCategory);

    // Create sub-categories
    for (let j = 0; j < CATEGORY_SUB_COUNT; j++) {
      const subCategory = await productCategoryService.create({
        name: `Sub Category ${i + 1}-${j + 1}`,
        description: faker.commerce.productAdjective(),
        handle: `sub-category-${i + 1}-${j + 1}`,
        parent_category_id: rootCategory.id,
      });

      // Create sub-sub-categories
      for (let k = 0; k < CATEGORY_SUB_SUB_COUNT; k++) {
        const subSubCategory = await productCategoryService.create({
          name: `Sub-Sub Category ${i + 1}-${j + 1}-${k + 1}`,
          description: faker.commerce.productAdjective(),
          handle: `sub-sub-category-${i + 1}-${j + 1}-${k + 1}`,
          parent_category_id: subCategory.id,
        });

        leafCategories.push(subSubCategory);
      }
    }
  }

  console.log(`Created ${rootCategories.length} root categories, ${leafCategories.length} leaf categories.`);

  // Create products
  console.log(`Creating ${PRODUCT_COUNT} products...`);
  const totalProducts = PRODUCT_COUNT;
  const batchSize = 100;
  let created = 0;

  // Create products in batches
  for (let i = 0; i < leafCategories.length; i++) {
    const category = leafCategories[i];
    
    // Create products for this category
    for (let j = 0; j < PRODUCTS_PER_CATEGORY; j++) {
      if (created >= totalProducts) break;
      
      // Generate random product data
      const title = faker.commerce.productName();
      const description = faker.lorem.paragraphs({ min: 1, max: 5 });
      const handle = `product-${created + 1}`;
      
      // Select random color and size
      const color = faker.helpers.arrayElement(COLORS);
      const size = faker.number.int({ min: 1, max: 10 }).toString();
      
      // Create product
      const product = await productService.create({
        title,
        description,
        handle,
        status: 'published',
        options: [
          { title: 'Color' },
          { title: 'Size' },
        ],
        variants: [
          {
            title: `${title} - ${color} - Size ${size}`,
            inventory_quantity: 100,
            manage_inventory: false,
            prices: [
              {
                currency_code: 'usd',
                amount: faker.number.int({ min: 1000, max: 100000 }),
              },
              {
                currency_code: 'chf',
                amount: faker.number.int({ min: 1000, max: 100000 }),
              },
            ],
            options: [
              { value: color },
              { value: size },
            ],
          },
        ],
        categories: [{ id: category.id }],
        metadata: {
          color,
          size: parseInt(size, 10),
          brand: faker.company.name(),
          tags: [faker.commerce.productMaterial(), faker.commerce.department()],
          labels: [faker.commerce.productAdjective(), faker.commerce.productAdjective()],
        },
      });

      // Generate random media (1-3 images)
      const mediaCount = faker.number.int({ min: 1, max: 3 });
      for (let k = 0; k < mediaCount; k++) {
        const width = faker.number.int({ min: 800, max: 1200 });
        const height = faker.number.int({ min: 600, max: 900 });
        
        // In a real scenario, we would upload actual images
        // For this benchmark, we'll just update the product with dummy image URLs
        await productService.update(product.id, {
          images: Array.from({ length: mediaCount }, (_, idx) => ({
            url: `https://picsum.photos/id/${faker.number.int({ min: 1, max: 1000 })}/${width}/${height}`,
          })),
        });
      }

      created++;
      
      if (created % batchSize === 0) {
        console.log(`Created ${created}/${totalProducts} products...`);
      }
    }
    
    if (created >= totalProducts) break;
  }

  console.log(`Seed completed. Created ${created} products.`);
}; 
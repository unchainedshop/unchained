const { faker } = require('@faker-js/faker');
const { DataSource } = require('typeorm');
const { 
  ProductService, 
  ProductCategoryService, 
  PriceListService,
  RegionService,
  ProductVariantService,
  ProductCollectionService,
  StoreService,
  UserService,
} = require('@medusajs/medusa');

// Define color palette
const colorPalette = [
  'Red', 'Blue', 'Green', 'Yellow', 'Black', 
  'White', 'Purple', 'Orange', 'Pink', 'Brown',
  'Gray', 'Cyan', 'Magenta', 'Lime', 'Teal'
];

// Connect to database
const connectToDatabase = async () => {
  const dataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [
      "node_modules/@medusajs/medusa/dist/models/*.js"
    ],
  });

  await dataSource.initialize();
  return dataSource;
};

// Create services
const createServices = (dataSource) => {
  const container = {
    manager: dataSource.manager,
    productRepository: dataSource.getRepository("Product"),
    productCategoryRepository: dataSource.getRepository("ProductCategory"),
    productVariantRepository: dataSource.getRepository("ProductVariant"),
    priceListRepository: dataSource.getRepository("PriceList"),
    moneyAmountRepository: dataSource.getRepository("MoneyAmount"),
    regionRepository: dataSource.getRepository("Region"),
    currencyRepository: dataSource.getRepository("Currency"),
    storeRepository: dataSource.getRepository("Store"),
    userRepository: dataSource.getRepository("User"),
    eventBusService: {
      emit: () => Promise.resolve(),
      withTransaction: () => ({ emit: () => Promise.resolve() }),
    },
    featureFlagRouter: {
      isFeatureEnabled: () => true,
    },
    productTagRepository: dataSource.getRepository("ProductTag"),
    shippingProfileService: {
      retrieveDefault: () => Promise.resolve({ id: "default" }),
    },
    productTypeRepository: dataSource.getRepository("ProductType"),
    imageRepository: dataSource.getRepository("Image"),
    productCollectionRepository: dataSource.getRepository("ProductCollection"),
  };

  const productService = new ProductService(container);
  const productCategoryService = new ProductCategoryService(container);
  const priceListService = new PriceListService(container);
  const regionService = new RegionService(container);
  const productVariantService = new ProductVariantService(container);
  const productCollectionService = new ProductCollectionService(container);
  const storeService = new StoreService(container);
  const userService = new UserService(container);

  return {
    productService,
    productCategoryService,
    priceListService,
    regionService,
    productVariantService,
    productCollectionService,
    storeService,
    userService,
    manager: dataSource.manager,
  };
};

// Create category structure
const createCategoryStructure = async (productCategoryService) => {
  console.log('Creating category structure...');
  const leafCategories = [];
  
  // Create 5 root categories
  for (let i = 0; i < 5; i++) {
    const rootName = `Category ${i + 1}`;
    const rootCategory = await productCategoryService.create({
      name: rootName,
      handle: faker.helpers.slugify(rootName).toLowerCase(),
    });
    
    // Create 10 sub-categories for each root
    for (let j = 0; j < 10; j++) {
      const subName = `${rootName} - Subcategory ${j + 1}`;
      const subCategory = await productCategoryService.create({
        name: subName,
        handle: faker.helpers.slugify(subName).toLowerCase(),
        parent_category_id: rootCategory.id,
      });
      
      // Create 10 sub-sub-categories for each sub-category
      for (let k = 0; k < 10; k++) {
        const subSubName = `${subName} - Subcategory ${k + 1}`;
        const subSubCategory = await productCategoryService.create({
          name: subSubName,
          handle: faker.helpers.slugify(subSubName).toLowerCase(),
          parent_category_id: subCategory.id,
        });
        
        leafCategories.push(subSubCategory.id);
      }
    }
  }
  
  console.log(`Created ${leafCategories.length} leaf categories`);
  return leafCategories;
};

// Create regions and currencies
const setupRegionsAndCurrencies = async (regionService) => {
  console.log('Setting up regions and currencies...');
  
  // Create US region with USD currency
  const usRegion = await regionService.create({
    name: 'United States',
    currency_code: 'usd',
    tax_rate: 0,
    payment_providers: ['manual'],
    fulfillment_providers: ['manual'],
    countries: ['us'],
  });
  
  // Create CH region with CHF currency
  const chRegion = await regionService.create({
    name: 'Switzerland',
    currency_code: 'chf',
    tax_rate: 0,
    payment_providers: ['manual'],
    fulfillment_providers: ['manual'],
    countries: ['ch'],
  });
  
  return [usRegion, chRegion];
};

// Create a random product
const createRandomProduct = async (
  productService,
  productVariantService,
  priceListService,
  leafCategoryIds,
  regions
) => {
  // Generate random product data
  const title = faker.commerce.productName();
  const subtitle = faker.commerce.productAdjective();
  const description = faker.lorem.paragraphs({ min: 1, max: 5 });
  const handle = faker.helpers.slugify(title).toLowerCase();
  const color = colorPalette[faker.number.int({ min: 0, max: colorPalette.length - 1 })];
  const size = faker.number.int({ min: 1, max: 10 });
  
  // Create product
  const product = await productService.create({
    title,
    subtitle,
    description,
    handle,
    status: 'published',
    options: [
      {
        title: 'Size',
      },
      {
        title: 'Color',
      },
    ],
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      value: faker.word.sample(),
    })),
    type: {
      value: faker.commerce.department(),
    },
    metadata: {
      brand: faker.company.name(),
    },
  });
  
  // Add product to a random category
  const randomCategoryIndex = faker.number.int({ min: 0, max: leafCategoryIds.length - 1 });
  await productService.addCategory(product.id, leafCategoryIds[randomCategoryIndex]);
  
  // Create variant
  const variant = await productVariantService.create(product.id, {
    title: `${title} - ${color} - Size ${size}`,
    inventory_quantity: 100,
    manage_inventory: true,
    sku: `${handle}-${color.toLowerCase()}-${size}`,
    barcode: faker.string.numeric(13),
    hs_code: faker.string.numeric(6),
    origin_country: faker.helpers.arrayElement(['US', 'CH']),
    mid_code: faker.string.numeric(4),
    material: faker.commerce.productMaterial(),
    weight: faker.number.int({ min: 100, max: 5000 }),
    length: faker.number.int({ min: 10, max: 100 }),
    height: faker.number.int({ min: 10, max: 100 }),
    width: faker.number.int({ min: 10, max: 100 }),
    options: [
      {
        option_id: product.options[0].id,
        value: `${size}`,
      },
      {
        option_id: product.options[1].id,
        value: color,
      },
    ],
    metadata: {
      color,
      size: size.toString(),
    },
  });
  
  // Add prices for USD and CHF
  await productVariantService.updateVariantPrices(variant.id, [
    {
      currency_code: 'usd',
      amount: faker.number.int({ min: 1000, max: 100000 }),
      region_id: regions[0].id,
    },
    {
      currency_code: 'chf',
      amount: faker.number.int({ min: 1000, max: 100000 }),
      region_id: regions[1].id,
    },
  ]);
  
  // Add images (1-3 images)
  const mediaCount = faker.number.int({ min: 1, max: 3 });
  const images = [];
  
  for (let i = 0; i < mediaCount; i++) {
    images.push({
      url: `https://picsum.photos/seed/${product.id}-${i}/800/600`,
    });
  }
  
  await productService.update(product.id, {
    images,
  });
  
  return product.id;
};

// Main seed function
const seed = async () => {
  console.log('Starting benchmark data seeding...');
  
  try {
    // Connect to database
    const dataSource = await connectToDatabase();
    
    // Create services
    const services = createServices(dataSource);
    
    // Check if already seeded
    const productsCount = await services.productService.count();
    if (productsCount >= 20000) {
      console.log('Database already seeded with benchmark data');
      return;
    }
    
    // Setup store
    await services.storeService.update({
      name: 'Medusa Benchmark Store',
      currencies: ['usd', 'chf'],
    });
    
    // Create admin user if not exists
    try {
      await services.userService.create({
        email: 'admin@medusa.com',
        password: 'supersecret',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      });
    } catch (error) {
      console.log('Admin user already exists');
    }
    
    // Setup regions and currencies
    const regions = await setupRegionsAndCurrencies(services.regionService);
    
    // Create category structure
    const leafCategoryIds = await createCategoryStructure(services.productCategoryService);
    
    // Create products
    console.log('Creating 20,000 products...');
    const TOTAL_PRODUCTS = 20000;
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);
      const promises = [];
      
      for (let j = 0; j < batchSize; j++) {
        promises.push(
          createRandomProduct(
            services.productService,
            services.productVariantService,
            services.priceListService,
            leafCategoryIds,
            regions
          )
        );
      }
      
      await Promise.all(promises);
      console.log(`Created products ${i + 1} to ${i + batchSize} of ${TOTAL_PRODUCTS}`);
    }
    
    console.log(`
      Benchmark data seeding completed:
      \nProducts: 20,000
      \nCategories: ${leafCategoryIds.length} (5 root, 50 sub, 500 sub-sub)
      \nCurrencies: USD, CHF
      \nRegions: United States, Switzerland
      \nAdmin User: admin@medusa.com / supersecret
    `);
  } catch (error) {
    console.error('Error seeding benchmark data:', error);
  }
  
  process.exit(0);
};

seed();
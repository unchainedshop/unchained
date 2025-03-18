import { Injectable } from '@nestjs/common';
import { 
  ChannelService, 
  TransactionalConnection, 
  RequestContext, 
  ID, 
  LanguageCode, 
  CurrencyCode, 
  FacetService, 
  FacetValueService, 
  ProductService, 
  AssetService, 
  CollectionService, 
  ShippingMethodService, 
  PaymentMethodService,
  InitialData,
  ChannelCreateInput,
  Asset,
  ProductOptionGroupService,
  ProductOptionService,
  TaxCategoryService,
  TaxRateService,
  ZoneService,
  CountryService,
  Role,
  RoleService,
  Permission,
  AdministratorService,
  ProductVariantService
} from '@vendure/core';
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

@Injectable()
export class seedVendure {
  constructor(
    private connection: TransactionalConnection,
    private channelService: ChannelService,
    private facetService: FacetService,
    private facetValueService: FacetValueService,
    private productService: ProductService,
    private productVariantService: ProductVariantService,
    private assetService: AssetService,
    private collectionService: CollectionService,
    private shippingMethodService: ShippingMethodService,
    private paymentMethodService: PaymentMethodService,
    private productOptionGroupService: ProductOptionGroupService,
    private productOptionService: ProductOptionService,
    private taxCategoryService: TaxCategoryService,
    private taxRateService: TaxRateService,
    private zoneService: ZoneService,
    private countryService: CountryService,
    private roleService: RoleService,
    private administratorService: AdministratorService
  ) {
    this.init();
  }

  async init() {
    try {
      // Check if products already exist
      const ctx = await this.createRequestContext();
      const existingProducts = await this.productService.findAll(ctx, { take: 1 });
      
      if (existingProducts.totalItems > 0) {
        console.log(`Found ${existingProducts.totalItems} existing products, skipping seed.`);
        return;
      }

      console.log('Starting seed process...');
      
      // Create initial data
      await this.createInitialData(ctx);
      
      // Create facets for color and size
      const { colorFacet, sizeFacet } = await this.createFacets(ctx);
      
      // Create category tree
      const { rootCollections, leafCollections } = await this.createCategoryTree(ctx);
      
      // Create products
      await this.createProducts(ctx, leafCollections, colorFacet.id, sizeFacet.id);
      
      console.log('Seed completed successfully.');
    } catch (error) {
      console.error('Error during seed process:', error);
    }
  }

  async createRequestContext(): Promise<RequestContext> {
    const channel = await this.channelService.getDefaultChannel();
    return new RequestContext({
      apiType: 'admin',
      isAuthorized: true,
      authorizedAsOwnerOnly: false,
      channel,
      languageCode: LanguageCode.en,
    });
  }

  async createInitialData(ctx: RequestContext) {
    console.log('Creating initial data...');
    
    // Create tax category
    const taxCategory = await this.taxCategoryService.create(ctx, {
      name: 'Standard Tax',
      isDefault: true,
    });

    // Create zone
    const zone = await this.zoneService.create(ctx, {
      name: 'Global',
    });

    // Add countries to zone
    const countries = await this.countryService.findAll(ctx);
    await this.zoneService.addMembersToZone(ctx, {
      zoneId: zone.id,
      memberIds: countries.items.map(c => c.id),
    });

    // Create tax rate
    await this.taxRateService.create(ctx, {
      name: 'Standard Tax Rate',
      enabled: true,
      value: 20,
      categoryId: taxCategory.id,
      zoneId: zone.id,
    });

    // Create shipping method
    await this.shippingMethodService.create(ctx, {
      code: 'standard-shipping',
      name: 'Standard Shipping',
      description: 'Standard shipping',
      calculator: {
        code: 'standard-shipping',
        arguments: [],
      },
    });

    // Create payment method
    await this.paymentMethodService.create(ctx, {
      name: 'Invoice Payment',
      code: 'invoice-payment',
      description: 'Pay by invoice',
      enabled: true,
      handler: {
        code: 'invoice-payment',
        arguments: [],
      },
    });

    // Create product option group for size
    const sizeGroup = await this.productOptionGroupService.create(ctx, {
      code: 'size',
      name: 'Size',
      options: Array.from({ length: 10 }, (_, i) => ({
        code: `size-${i + 1}`,
        name: `${i + 1}`,
      })),
    });

    // Create product option group for color
    const colorGroup = await this.productOptionGroupService.create(ctx, {
      code: 'color',
      name: 'Color',
      options: COLORS.map(color => ({
        code: `color-${color.toLowerCase()}`,
        name: color,
      })),
    });

    console.log('Initial data created.');
  }

  async createFacets(ctx: RequestContext) {
    console.log('Creating facets...');
    
    // Create color facet
    const colorFacet = await this.facetService.create(ctx, {
      code: 'color',
      name: 'Color',
      isPrivate: false,
    });

    // Create color facet values
    for (const color of COLORS) {
      await this.facetValueService.create(ctx, {
        facetId: colorFacet.id,
        code: color.toLowerCase(),
        name: color,
      });
    }

    // Create size facet
    const sizeFacet = await this.facetService.create(ctx, {
      code: 'size',
      name: 'Size',
      isPrivate: false,
    });

    // Create size facet values
    for (let i = 1; i <= 10; i++) {
      await this.facetValueService.create(ctx, {
        facetId: sizeFacet.id,
        code: `size-${i}`,
        name: i.toString(),
      });
    }

    console.log('Facets created.');
    return { colorFacet, sizeFacet };
  }

  async createCategoryTree(ctx: RequestContext) {
    console.log('Creating category tree...');
    
    const rootCollections: ID[] = [];
    const leafCollections: ID[] = [];

    // Create root categories
    for (let i = 0; i < CATEGORY_ROOT_COUNT; i++) {
      const rootCollection = await this.collectionService.create(ctx, {
        name: `Root Category ${i + 1}`,
        description: faker.commerce.department(),
        slug: `root-category-${i + 1}`,
        isPrivate: false,
      });

      rootCollections.push(rootCollection.id);

      // Create sub-categories
      for (let j = 0; j < CATEGORY_SUB_COUNT; j++) {
        const subCollection = await this.collectionService.create(ctx, {
          name: `Sub Category ${i + 1}-${j + 1}`,
          description: faker.commerce.productAdjective(),
          slug: `sub-category-${i + 1}-${j + 1}`,
          parentId: rootCollection.id,
          isPrivate: false,
        });

        // Create sub-sub-categories
        for (let k = 0; k < CATEGORY_SUB_SUB_COUNT; k++) {
          const subSubCollection = await this.collectionService.create(ctx, {
            name: `Sub-Sub Category ${i + 1}-${j + 1}-${k + 1}`,
            description: faker.commerce.productAdjective(),
            slug: `sub-sub-category-${i + 1}-${j + 1}-${k + 1}`,
            parentId: subCollection.id,
            isPrivate: false,
          });

          leafCollections.push(subSubCollection.id);
        }
      }
    }

    console.log(`Created ${rootCollections.length} root categories, ${leafCollections.length} leaf categories.`);
    return { rootCollections, leafCollections };
  }

  async createProducts(ctx: RequestContext, leafCollections: ID[], colorFacetId: ID, sizeFacetId: ID) {
    console.log(`Creating ${PRODUCT_COUNT} products...`);
    
    const totalProducts = PRODUCT_COUNT;
    const batchSize = 100;
    let created = 0;

    // Get all facet values for color and size
    const colorFacetValues = await this.facetValueService.findByFacetId(ctx, colorFacetId);
    const sizeFacetValues = await this.facetValueService.findByFacetId(ctx, sizeFacetId);

    // Create products in batches
    for (let i = 0; i < leafCollections.length; i++) {
      const collectionId = leafCollections[i];
      
      // Create products for this category
      for (let j = 0; j < PRODUCTS_PER_CATEGORY; j++) {
        if (created >= totalProducts) break;
        
        // Generate random product data
        const name = faker.commerce.productName();
        const description = faker.lorem.paragraphs({ min: 1, max: 5 });
        const slug = `product-${created + 1}`;
        
        // Select random facet values for color and size
        const colorFacetValue = faker.helpers.arrayElement(colorFacetValues);
        const sizeFacetValue = faker.helpers.arrayElement(sizeFacetValues);
        
        // Create product
        const product = await this.productService.create(ctx, {
          name,
          slug,
          description,
          facetValueIds: [colorFacetValue.id, sizeFacetValue.id],
          customFields: {
            color: colorFacetValue.name,
            size: parseInt(sizeFacetValue.name, 10),
          },
        });

        // Create product variant
        const variant = await this.productVariantService.create(ctx, {
          productId: product.id,
          name: `${name} - ${colorFacetValue.name} - Size ${sizeFacetValue.name}`,
          sku: `SKU-${created + 1}`,
          price: faker.number.int({ min: 1000, max: 100000 }),
          facetValueIds: [colorFacetValue.id, sizeFacetValue.id],
          stockOnHand: 100,
          trackInventory: false,
        });

        // Create USD price
        await this.productVariantService.updateVariantPrice(ctx, {
          variantId: variant.id,
          price: faker.number.int({ min: 1000, max: 100000 }),
          currencyCode: CurrencyCode.USD,
        });

        // Create CHF price
        await this.productVariantService.updateVariantPrice(ctx, {
          variantId: variant.id,
          price: faker.number.int({ min: 1000, max: 100000 }),
          currencyCode: CurrencyCode.CHF,
        });

        // Generate random media (1-3 images)
        const mediaCount = faker.number.int({ min: 1, max: 3 });
        for (let k = 0; k < mediaCount; k++) {
          const width = faker.number.int({ min: 800, max: 1200 });
          const height = faker.number.int({ min: 600, max: 900 });
          const asset = await this.assetService.create(ctx, {
            file: {
              filename: `product-${created + 1}-image-${k + 1}.jpg`,
              mimetype: 'image/jpeg',
              stream: null as any,
              buffer: Buffer.from('dummy-image-data'),
            },
            name: `Product ${created + 1} Image ${k + 1}`,
            focalPoint: {
              x: 0.5,
              y: 0.5,
            },
            tags: ['product', 'gallery'],
          });

          // Add asset to product
          await this.productService.addOptionGroupToProduct(ctx, {
            productId: product.id,
            optionGroupId: asset.id as any,
          });
        }

        // Add product to collection
        await this.collectionService.addProductsToCollection(ctx, {
          collectionId,
          productIds: [product.id],
        });

        created++;
        
        if (created % batchSize === 0) {
          console.log(`Created ${created}/${totalProducts} products...`);
        }
      }
      
      if (created >= totalProducts) break;
    }

    console.log(`Created ${created} products.`);
  }
} 
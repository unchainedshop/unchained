import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { intervalUntilTimeout } from './lib/wait.js';

let db;
let graphqlFetch;

describe('Bulk Importer', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Import Products', () => {
    it('adds 1 Product CREATE event and 1 UPDATE event, followed by DELETE & CREATE again', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(
              type: BULK_IMPORT
              input: $input
              retries: 0
              priority: 10
            ) {
              _id
            }
          }
        `,
        variables: {
          input: {
            events: [
              {
                entity: "PRODUCT",
                operation: "CREATE",
                payload: {
                  _id: "A",
                  specification: {
                    tags: ["nice"],
                    type: "SimpleProduct",
                    published: "2020-01-01T00:00Z",
                    commerce: {
                      salesUnit: "ST",
                      salesQuantityPerUnit: "1",
                      defaultOrderQuantity: "6",
                      pricing: [
                        {
                          isTaxable: true,
                          isNetPrice: true,
                          countryCode: "CH",
                          currencyCode: "CHF",
                          amount: 10000,
                        },
                      ],
                    },
                    warehousing: {
                      baseUnit: "ST",
                      dimensions: {
                        weightInGram: 0,
                        heightInMillimeters: 0,
                        lengthInMillimeters: 0,
                        widthInMillimeters: 0,
                      },
                    },
                    variationResolvers: [
                      {
                        vector: {
                          color: "red",
                        },
                        productId: "B",
                      },
                    ],
                    plan: {
                      billingInterval: "DAYS",
                      billingIntervalCount: 1,
                      usageCalculationType: "METERED",
                      trialInterval: "DAYS",
                      trialIntervalCount: 1,
                    },
                    bundleItems: [
                      {
                        productId: "c",
                        quantity: 1,
                        configuration: [
                          {
                            key: "greeting",
                            value: "For my Darling",
                          },
                        ],
                      },
                    ],
                    meta: {},
                    content: {
                      de: {
                        vendor: "Herstellername",
                        brand: "Marke",
                        title: "Produktname",
                        slug: "produktname",
                        subtitle: "Short description",
                        description: "Long description",
                        labels: ["Neu"],
                      },
                    },
                  },
                  media: [
                    {
                      _id: "product-a-format",
                      asset: {
                        _id: "format-v1",
                        fileName: "test-image.png",
                        url: "https://dummyimage.com/600x400/000/fff&text=Create+Product",
                      },
                      tags: ["big"],
                      meta: {},
                      content: {
                        de: {
                          title: "Produktname",
                          subtitle: "Short description",
                        },
                      },
                    },
                  ],
                  variations: [
                    {
                      key: "color",
                      type: "COLOR",
                      options: [
                        {
                          value: "ff0000",
                          content: {
                            de: {
                              title: "Rot",
                              subtitle: "",
                            },
                          },
                        },
                      ],
                      content: {
                        de: {
                          title: "Farbe",
                          subtitle: "Farbvariante",
                        },
                      },
                    },
                  ],
                },
              },
              {
                entity: "PRODUCT",
                operation: "UPDATE",
                payload: {
                  _id: "A",
                  specification: {
                    tags: ["awesome"],
                    meta: {
                      something: 1,
                    },
                  },
                  media: [
                    {
                      _id: "product-a-format",
                      asset: {
                        _id: "format-v1",
                        fileName: "test-image-updated.png",
                        url: "https://dummyimage.com/300x300/e2e2e2/040&text=Update+Product",
                      },
                      tags: ["big"],
                      meta: {},
                      content: {
                        de: {
                          title: "Produktname",
                          subtitle: "Short description",
                        },
                      },
                    },
                    {
                      _id: "product-a-meteor",
                      asset: {
                        _id: "meteor",
                        fileName: "meteor-blue.png",
                        url: "https://docs.meteor.com/meteor-blue.png",
                      },
                      tags: ["small"],
                      meta: {},
                      content: {
                        de: {
                          title: "Will Meteor die?",
                        },
                      },
                    },
                  ],
                },
              },
              {
                entity: "PRODUCT",
                operation: "REMOVE",
                payload: {
                  _id: "A",
                },
              },
              {
                entity: 'PRODUCT',
                operation: 'CREATE',
                payload: {
                  _id: 'A',
                  specification: {
                    tags: ['awesome2'],
                    type: 'SimpleProduct',
                    published: '2020-01-01T00:00Z',
                    commerce: {
                      salesUnit: 'ST',
                      salesQuantityPerUnit: '1',
                      defaultOrderQuantity: '6',
                      pricing: [
                        {
                          isTaxable: true,
                          isNetPrice: true,
                          countryCode: 'CH',
                          currencyCode: 'CHF',
                          amount: 10000,
                        },
                      ],
                    },
                    meta: {},
                    content: {
                      de: {
                        vendor: 'Herstellername',
                        brand: 'Marke',
                        title: 'Produktname',
                        slug: 'produktname',
                        subtitle: 'Short description',
                        description: 'Long description',
                        labels: ['Neu'],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      });
      expect(addWork).toMatchObject({});

      const Products = db.collection('products');

      const result = await intervalUntilTimeout(async () => {
        const product = await Products.findOne({ tags: 'awesome2' });
        return !!product;
      }, 5000);

      expect(result).toBe(true);
    }, 15000);
  });

  describe('Import Filters', () => {
    it('adds 1 CREATE and 1 UPDATE event', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(
              type: BULK_IMPORT
              input: $input
              retries: 0
              priority: 10
            ) {
              _id
            }
          }
        `,
        variables: {
          input: {
            events: [
              {
                entity: 'FILTER',
                operation: 'CREATE',
                payload: {
                  _id: 'Filter A',
                  specification: {
                    key: 'size_cm',
                    isActive: true,
                    type: 'SINGLE_CHOICE',
                    options: [
                      {
                        value: '10',
                        content: {
                          de: {
                            title: '10 cm',
                            subtitle: '',
                          },
                        },
                      },
                    ],
                    content: {
                      de: {
                        title: 'Size',
                        subtitle: 'Size of product in centimeters',
                      },
                    },
                    meta: {},
                  },
                },
              },
              {
                entity: 'FILTER',
                operation: 'UPDATE',
                payload: {
                  _id: 'Filter A',
                  specification: {
                    isActive: false,
                    options: [
                      {
                        value: '10',
                        content: {
                          de: {
                            title: '10 cm',
                            subtitle: '',
                          },
                        },
                      },
                      {
                        value: '20',
                        content: {
                          de: {
                            title: '20 cm',
                            subtitle: '',
                          },
                        },
                      },
                    ],
                    meta: {},
                  },
                },
              },
            ],
          },
        },
      });

      expect(addWork).toMatchObject({});

      const Filters = db.collection('filters');

      const result = await intervalUntilTimeout(async () => {
        const filter = await Filters.findOne({ _id: 'Filter A' });
        return filter.isActive === false;
      }, 3000);

      expect(result).toBe(true);
    }, 10000);
  });

  describe('Import Assortments', () => {
    it('adds 2 CREATE and 1 UPDATE event', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(
              type: BULK_IMPORT
              input: $input
              retries: 0
              priority: 10
            ) {
              _id
            }
          }
        `,
        variables: {
          input: {
            events: [
              {
                entity: 'ASSORTMENT',
                operation: 'CREATE',
                payload: {
                  _id: 'Assortment B',
                  specification: {
                    isActive: true,
                    isBase: false,
                    isRoot: false,
                    content: {
                      de: {
                        title: 'Groceries Child Category',
                        slug: 'groceries',
                        subtitle: 'Short description',
                        description: 'Long description',
                      },
                    },
                  },
                },
              },
              {
                entity: 'ASSORTMENT',
                operation: 'CREATE',
                payload: {
                  _id: 'Assortment A',
                  specification: {
                    isActive: true,
                    isBase: true,
                    isRoot: true,
                    tags: ['food'],
                    meta: {},
                    content: {
                      de: {
                        title: 'Groceries',
                        slug: 'groceries',
                        subtitle: 'Short description',
                        description: 'Long description',
                      },
                    },
                  },
                  products: [
                    {
                      _id: 'assortment-product',
                      productId: 'A',
                      tags: ['big'],
                      meta: {},
                    },
                  ],
                  children: [
                    {
                      _id: 'assortment-link',
                      assortmentId: 'Assortment B',
                      tags: [],
                      meta: {},
                    },
                  ],
                  filters: [
                    {
                      _id: 'assortment-filter',
                      filterId: 'Filter A',
                      tags: [],
                      meta: {},
                    },
                  ],
                  media: [
                    {
                      _id: null,
                      asset: {
                        _id: null,
                        fileName: 'logo-light.svg',
                        url: 'https://sandbox-v2.unchained.shop/logo-light.svg',
                      },
                      tags: ['big'],
                      meta: {},
                      content: {
                        de: {
                          title: 'assormtneName',
                          subtitle: 'Short description',
                        },
                      },
                    },
                  ],
                },
              },
              {
                entity: 'ASSORTMENT',
                operation: 'UPDATE',
                payload: {
                  _id: 'Assortment A',
                  specification: {
                    tags: ['base'],
                  },
                  products: [
                    {
                      productId: 'A',
                      tags: ['small'],
                      meta: {},
                    },
                  ],
                  media: [
                    {
                      _id: 'assortment-a-meteor',
                      asset: {
                        _id: 'assortment-asset-update',
                        fileName: 'meteor-blue.png',
                        url: 'https://docs.meteor.com/meteor-blue.png',
                      },
                      tags: ['small'],
                      meta: {},
                      content: {
                        de: {
                          title: 'Will Meteor die?',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      });

      expect(addWork).toMatchObject({});

      const Assortments = db.collection('assortments');
      const AssortmentMedia = db.collection('assortment_media');

      const assortmentHasBaseTag = await intervalUntilTimeout(async () => {
        const assortment = await Assortments.findOne({ _id: 'Assortment A' });

        return assortment?.tags.includes('base');
      }, 3000);

      const updatedAssortmentMediaHasSmallTag = await intervalUntilTimeout(
        async () => {
          const assortmentMedia = await AssortmentMedia.findOne({
            _id: 'assortment-a-meteor',
          });
          return assortmentMedia?.tags.includes('small');
        },
        3000,
      );
      expect(updatedAssortmentMediaHasSmallTag).toBe(true);
      expect(assortmentHasBaseTag).toBe(true);

      const AssortmentProducts = db.collection('assortment_products');

      const productLinkHasBeenReplaced = await intervalUntilTimeout(
        async () => {
          const productLinksCount = await AssortmentProducts.countDocuments({
            assortmentId: 'Assortment A',
          });
          return productLinksCount === 1;
        },
        3000,
      );

      expect(productLinkHasBeenReplaced).toBe(true);
    }, 10000);
  });
});

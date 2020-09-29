import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { intervalUntilTimeout } from './lib/wait';

let connection;
let db;
let graphqlFetch;

describe('Bulk Importer', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Import Products', () => {
    it('adds 1 Product CREATE event and 1 UPDATE event', async () => {
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
                entity: 'PRODUCT',
                operation: 'CREATE',
                payload: {
                  _id: 'A',
                  specification: {
                    tags: ['nice'],
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
                    warehousing: {
                      baseUnit: 'ST',
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
                          color: 'red',
                        },
                        productId: 'B',
                      },
                    ],
                    plan: {
                      billingInterval: 'daily',
                      billingIntervalCount: 1,
                      usageCalculationType: 'metered',
                      trialInterval: 'daily',
                      trialIntervalCount: 1,
                    },
                    bundleItems: [
                      {
                        productId: 'c',
                        quantity: 1,
                        configuration: [
                          {
                            key: 'greeting',
                            value: 'For my Darling',
                          },
                        ],
                      },
                    ],
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
                  media: [
                    {
                      _id: 'product-a-format',
                      asset: {
                        _id: 'format-v1',
                        fileName: 'format-jpeg.jpg',
                        url:
                          'https://www.story.one/media/images/poop-4108423_1920.width-1600.format-jpeg.jpg',
                      },
                      tags: ['big'],
                      meta: {},
                      content: {
                        de: {
                          title: 'Produktname',
                          subtitle: 'Short description',
                        },
                      },
                    },
                  ],
                  variations: [
                    {
                      key: 'color',
                      type: 'COLOR',
                      options: [
                        {
                          value: 'ff0000',
                          content: {
                            de: {
                              title: 'Rot',
                              subtitle: '',
                            },
                          },
                        },
                      ],
                      content: {
                        de: {
                          title: 'Farbe',
                          subtitle: 'Farbvariante',
                        },
                      },
                    },
                  ],
                },
              },
              {
                entity: 'PRODUCT',
                operation: 'UPDATE',
                payload: {
                  _id: 'A',
                  specification: {
                    tags: ['awesome'],
                    meta: {
                      something: 1,
                    },
                  },
                  media: [
                    {
                      _id: 'product-a-meteor',
                      asset: {
                        _id: 'meteor',
                        fileName: 'meteor-will-never-die.svg',
                        url:
                          'https://docs.meteor.com/images/logo-coralspace-left.svg',
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

      const Products = db.collection('products');

      const result = await intervalUntilTimeout(async () => {
        const product = await Products.findOne({ _id: 'A' });
        return product?.tags.includes('awesome');
      }, 1000);

      expect(result).toBe(true);
    });
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
      }, 1000);

      expect(result).toBe(true);
    });
  });
});

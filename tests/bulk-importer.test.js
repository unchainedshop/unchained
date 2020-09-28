import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN } from './seeds/users';

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
    it('adds 1 Product INSERT event', async () => {
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
                      asset: {
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
            ],
          },
        },
      });
      expect(addWork).toMatchObject({});
    });
  });
});

import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { intervalUntilTimeout } from './wait.js';
import { filters } from '@unchainedshop/core-filters';
import { products } from '@unchainedshop/core-products';
import { assortments, assortmentMedia, assortmentProducts } from '@unchainedshop/core-assortments';
import { eq, sql } from '@unchainedshop/store';
import assert from 'node:assert';
import test from 'node:test';

let createLoggedInGraphqlFetch;

test.describe('Bulk Importer', () => {
  let graphqlFetch;
  let db;

  test.before(async () => {
    ({ createLoggedInGraphqlFetch, db } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Import Products', () => {
    test('adds 1 Product CREATE event and 1 UPDATE event, followed by DELETE & CREATE again', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(type: BULK_IMPORT, input: $input, retries: 0, priority: 10) {
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
                    sequence: 1,
                    tags: ['nice'],
                    type: 'SIMPLE_PRODUCT',
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
                      billingInterval: 'DAYS',
                      billingIntervalCount: 1,
                      usageCalculationType: 'METERED',
                      trialInterval: 'DAYS',
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
                        fileName: 'test-image.png',
                        url: 'https://dummyimage.com/600x400/000/fff&text=Create+Product',
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
                      _id: 'product-a-format',
                      asset: {
                        _id: 'format-v1',
                        fileName: 'test-image-updated.png',
                        url: 'https://dummyimage.com/300x300/e2e2e2/040&text=Update+Product',
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
                    {
                      _id: 'product-a-meteor',
                      asset: {
                        _id: 'meteor',
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
              {
                entity: 'PRODUCT',
                operation: 'REMOVE',
                payload: {
                  _id: 'A',
                },
              },
              {
                entity: 'PRODUCT',
                operation: 'CREATE',
                payload: {
                  _id: 'A',
                  specification: {
                    sequence: 2,
                    tags: ['awesome2'],
                    type: 'SIMPLE_PRODUCT',
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
      assert.ok(addWork);

      const result = await intervalUntilTimeout(async () => {
        const [product] = await db
          .select()
          .from(products)
          .where(sql`EXISTS (SELECT 1 FROM json_each(${products.tags}) WHERE value = 'awesome2')`)
          .limit(1);
        return !!product;
      }, 10000);

      assert.strictEqual(result, true);
    }, 30000);
  });

  test.describe('Import Filters', () => {
    test('adds 1 CREATE and 1 UPDATE event', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(type: BULK_IMPORT, input: $input, retries: 0, priority: 10) {
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

      assert.ok(addWork);

      const result = await intervalUntilTimeout(async () => {
        const [filter] = await db.select().from(filters).where(eq(filters._id, 'Filter A')).limit(1);
        return filter?.isActive === false;
      }, 3000);

      assert.strictEqual(result, true);
    }, 10000);
  });

  test.describe('Import Assortments', () => {
    test('adds 2 CREATE and 1 UPDATE event', async () => {
      const { data: { addWork } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addWork($input: JSON) {
            addWork(type: BULK_IMPORT, input: $input, retries: 0, priority: 10) {
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
                    sequence: 2,
                    isActive: true,
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
                    sequence: 1,
                    isActive: true,
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
                      sortKey: 0,
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
                      asset: {
                        fileName: 'logo-light.svg',
                        url: 'https://docs.unchained.shop/img/unchained-logomark.svg',
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

      assert.ok(addWork);

      const assortmentHasBaseTag = await intervalUntilTimeout(async () => {
        const [assortment] = await db
          .select()
          .from(assortments)
          .where(eq(assortments._id, 'Assortment A'))
          .limit(1);
        return assortment?.tags?.includes('base');
      }, 3000);

      const updatedAssortmentMediaHasSmallTag = await intervalUntilTimeout(async () => {
        const [media] = await db
          .select()
          .from(assortmentMedia)
          .where(eq(assortmentMedia._id, 'assortment-a-meteor'))
          .limit(1);
        return media?.tags?.includes('small');
      }, 3000);
      assert.strictEqual(updatedAssortmentMediaHasSmallTag, true);
      assert.strictEqual(assortmentHasBaseTag, true);

      const productLinkHasBeenReplaced = await intervalUntilTimeout(async () => {
        const [result] = await db
          .select({ count: sql`count(*)` })
          .from(assortmentProducts)
          .where(eq(assortmentProducts.assortmentId, 'Assortment A'));
        return result?.count === 1;
      }, 3000);

      assert.strictEqual(productLinkHasBeenReplaced, true);
    }, 10000);
  });
});

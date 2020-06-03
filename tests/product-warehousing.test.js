import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleProduct } from './seeds/products';

let connection;
let graphqlFetch;

describe('ProductsWarehousing', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('mutation.updateProductWarehousing should for admin user', () => {
    it('Update product warehousing successfuly', async () => {
      const { data: { updateProductWarehousing } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(
              productId: $productId
              warehousing: $warehousing
            ) {
              _id
              sequence
              status
              tags
              updated
              created
              published
              texts {
                _id
              }
              media {
                _id
              }
              reviews {
                _id
              }
              meta
              assortmentPaths {
                links {
                  link {
                    _id
                  }
                  assortmentId
                }
              }
              siblings {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      expect(updateProductWarehousing._id).toEqual(SimpleProduct._id);
    });

    it('return error when attempting to update non existing product', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(
              productId: $productId
              warehousing: $warehousing
            ) {
              _id
            }
          }
        `,
        variables: {
          productId: 'none-existing-id',
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });

  describe('mutation.updateProductWarehousing for anonymous user', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation UpdateProductWarehousing(
            $productId: ID!
            $warehousing: UpdateProductWarehousingInput!
          ) {
            updateProductWarehousing(
              productId: $productId
              warehousing: $warehousing
            ) {
              _id
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});

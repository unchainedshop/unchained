import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { PlanProduct, SimpleProduct } from './seeds/products';

let graphqlFetch;

describe('ProductsWarehousing', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('mutation.updateProductWarehousing should for admin user', () => {
    it('Update product warehousing successfuly when passed SIMPLE_PRODUCT type', async () => {
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

    it('return error when passed non SIMPLE_PRODUCT type', async () => {
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
          productId: PlanProduct._id,
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'ProductWrongTypeError',
        received: PlanProduct.type,
        required: 'SIMPLE_PRODUCT',
      });
    });

    it('return not found error when passed non existing productId', async () => {
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

      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
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
          productId: '',
          warehousing: {
            sku: 'SKU-100',
            baseUnit: 'Kg',
          },
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('mutation.updateProductWarehousing for anonymous user', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
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

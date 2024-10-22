import { setupDatabase, createAnonymousGraphqlFetch } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetch;

describe('public queries', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  it('products', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          products {
            _id
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    expect(data.products.length).toBeGreaterThan(0);

    const [product] = data.products;
    expect(product).toMatchObject({
      _id: SimpleProduct._id,
    });
  });

  it('product', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          product(productId: "simpleproduct") {
            _id
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    const { product } = data;
    expect(product).toMatchObject({
      _id: SimpleProduct._id,
    });
  });

  it('query.productCatalogPrices', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "simpleproduct") {
            amount
            currency {
              _id
              isoCode
            }
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    expect(data.productCatalogPrices[0]).toMatchObject({
      amount: 10000,
      currency: {
        isoCode: 'CHF',
      },
    });
  });

  it('query.productCatalogPrices return error when passed invalid productId', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "") {
            amount
            currency {
              _id
              isoCode
            }
          }
        }
      `,
    });

    expect(data).toEqual(null);
    expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
  });

  it('translatedProductTexts', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          translatedProductTexts(productId: "simpleproduct") {
            locale
            slug
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    expect(data.translatedProductTexts).toMatchObject([
      {
        locale: 'de',
        slug: 'slug-de',
      },
      {
        locale: 'fr',
        slug: 'slug-fr',
      },
    ]);
  });

  it('translatedProductMediaTexts', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          translatedProductMediaTexts(productMediaId: "jpeg-product") {
            title
            locale
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    expect(data.translatedProductMediaTexts).toMatchObject([
      {
        locale: 'de',
        title: 'product-media-title-de',
      },
      {
        locale: 'fr',
        title: 'product-media-title-fr',
      },
    ]);
  });
});

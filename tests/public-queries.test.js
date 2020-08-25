import { setupDatabase, createAnonymousGraphqlFetch } from './helpers';

let connection;
// let db;
let graphqlFetch;

describe('public queries', () => {
  beforeAll(async () => {
    [, /* db */ connection] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
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
    expect(product).toBeTruthy();
    expect(product._id).toBe('simpleproduct');
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
    expect(product).toBeTruthy();
    expect(product._id).toBe('simpleproduct');
  });

  it('query.productCatalogPrices', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "simpleproduct") {
            price {
              amount
              currency
            }
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    const { price } = data.productCatalogPrices[0];
    expect(price.amount).toBe(10000);
    expect(price.currency).toBe('CHF');
  });

  it('query.productCatalogPrices return not found error when passed non existing productId', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "invalid-product-id") {
            price {
              amount
              currency
            }
          }
        }
      `,
    });

    expect(data).toEqual(null);
    expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
  });

  it('query.productCatalogPrices return error when passed invalid productId', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "") {
            price {
              amount
              currency
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
    const de = data.translatedProductTexts.find(
      (texts) => texts.locale === 'de',
    );
    const fr = data.translatedProductTexts.find(
      (texts) => texts.locale === 'fr',
    );
    expect(de.slug).toBe('slug-de');
    expect(fr.slug).toBe('slug-fr');
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
    const de = data.translatedProductMediaTexts.find(
      (texts) => texts.locale === 'de',
    );
    const fr = data.translatedProductMediaTexts.find(
      (texts) => texts.locale === 'fr',
    );
    expect(de.title).toBe('product-media-title-de');
    expect(fr.title).toBe('product-media-title-fr');
  });
});

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
    expect(product._id).toBe('simple-product');
  });

  it('product', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          product(productId: "simple-product") {
            _id
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    const { product } = data;
    expect(product).toBeTruthy();
    expect(product._id).toBe('simple-product');
  });

  it('productCatalogPrices', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          productCatalogPrices(productId: "simple-product") {
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

  it('translatedProductTexts', async () => {
    const { data, errors } = await graphqlFetch({
      query: /* GraphQL */ `
        {
          translatedProductTexts(productId: "simple-product") {
            locale
            slug
          }
        }
      `,
    });

    expect(errors).toEqual(undefined);
    const de = data.translatedProductTexts.find(
      (texts) => texts.locale === 'de'
    );
    const fr = data.translatedProductTexts.find(
      (texts) => texts.locale === 'fr'
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
      (texts) => texts.locale === 'de'
    );
    const fr = data.translatedProductMediaTexts.find(
      (texts) => texts.locale === 'fr'
    );
    expect(de.title).toBe('product-media-title-de');
    expect(fr.title).toBe('product-media-title-fr');
  });
});

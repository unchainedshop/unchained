const price = (countryCode, currencyCode, amount) => ({
  countryCode,
  currencyCode,
  amount,
  minQuantity: 0,
  isTaxable: true,
  isNetPrice: false,
});

const product = (_id, { type = 'SIMPLE_PRODUCT', status = 'ACTIVE', pricing = [], ...rest } = {}) => ({
  _id,
  type,
  status,
  sequence: 0,
  slugs: [_id],
  created: new Date('2026-11-01T10:00:00Z'),
  published: status === 'ACTIVE' ? new Date('2026-11-01T10:00:00Z') : null,
  commerce: { pricing },
  ...rest,
});

export const StorefrontProducts = {
  mini8: product('sf-mini-8', {
    meta: { brand: 'Nordlicht' },
    pricing: [price('CH', 'CHF', 3900), price('DE', 'EUR', 5900)],
  }),
  atLimit: product('sf-at-limit', {
    meta: { brand: 'Alpenwerk' },
    pricing: [price('CH', 'CHF', 5000), price('DE', 'EUR', 5000)],
  }),
  swissOnly: product('sf-ch-only', {
    meta: { brand: 'Nordlicht' },
    pricing: [price('CH', 'CHF', 4500)],
  }),
  draft: product('sf-draft', {
    status: 'DRAFT',
    meta: { brand: 'Nordlicht' },
    pricing: [price('CH', 'CHF', 2000)],
  }),
  hidden: product('sf-hidden', {
    tags: ['storefront-hidden'],
    meta: { brand: 'Nordlicht' },
    pricing: [price('CH', 'CHF', 2500)],
  }),
  cheapVariant: product('sf-variant-cheap', {
    pricing: [price('CH', 'CHF', 3000), price('DE', 'EUR', 3000)],
  }),
  draftVariant: product('sf-variant-draft', {
    status: 'DRAFT',
    pricing: [price('CH', 'CHF', 1000), price('DE', 'EUR', 1000)],
  }),
  expensiveVariant: product('sf-variant-expensive', {
    pricing: [price('CH', 'CHF', 9000), price('DE', 'EUR', 9000)],
  }),
  configurable: product('sf-configurable', {
    type: 'CONFIGURABLE_PRODUCT',
    meta: { brand: 'Alpenwerk' },
    proxy: {
      assignments: ['sf-variant-cheap', 'sf-variant-draft', 'sf-variant-expensive'].map(
        (productId, index) => ({ vector: { size: String(index) }, productId }),
      ),
    },
  }),
};

const CreateFilter = /* GraphQL */ `
  mutation CreateFilter($filter: CreateFilterInput!, $texts: [FilterTextInput!]) {
    createFilter(filter: $filter, texts: $texts) {
      _id
    }
  }
`;

const ActivateFilter = /* GraphQL */ `
  mutation ActivateFilter($filterId: ID!) {
    updateFilter(filterId: $filterId, filter: { isActive: true }) {
      _id
    }
  }
`;

export const seedStorefrontCatalog = async (db, adminGraphqlFetch) => {
  const products = Object.values(StorefrontProducts);
  await db.collection('products').insertMany(products);
  await db.collection('product_texts').insertMany(
    products.map(({ _id, meta }) => ({
      _id: `${_id}-de`,
      productId: _id,
      locale: 'de',
      slug: _id,
      title: `${_id} Rucksack`,
      brand: meta?.brand,
      description: `Beschreibung ${_id}`,
    })),
  );
  await db.collection('product_texts').insertOne({
    _id: 'sf-mini-8-en',
    productId: 'sf-mini-8',
    locale: 'en',
    slug: 'sf-mini-8-en',
    title: 'Mini 8 Backpack',
  });

  const createFilter = async (filter, title, subtitle) => {
    const { data } = await adminGraphqlFetch({
      query: CreateFilter,
      variables: { filter, texts: [{ locale: 'de', title, subtitle }] },
    });
    const filterId = data.createFilter._id;
    await adminGraphqlFetch({ query: ActivateFilter, variables: { filterId } });
    return filterId;
  };

  return {
    brand: await createFilter(
      { key: 'meta.brand', type: 'SINGLE_CHOICE', options: ['Nordlicht', 'Alpenwerk'] },
      'Marke',
    ),
    priceCH: await createFilter(
      { key: 'price_ch', type: 'RANGE' },
      'Preis in der Schweiz',
      'CHF in Rappen, 5000 = CHF 50.00',
    ),
    priceDE: await createFilter(
      { key: 'price_de', type: 'RANGE' },
      'Preis in Deutschland',
      'EUR in Cent, 5000 = EUR 50.00',
    ),
  };
};

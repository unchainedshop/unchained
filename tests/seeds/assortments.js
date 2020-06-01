export const SimpleAssortment = [
  {
    _id: "simple-assortment",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["unique-slug", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
    warehousing: {
      sku: "SKU",
      baseUnit: "ST",
    },
    tags: ["tag-1", "tag-2", "highlight"],
    commerce: {
      pricing: [
        {
          amount: 10000,
          maxQuantity: 0,
          isTaxable: true,
          isNetPrice: false,
          currencyCode: "CHF",
          countryCode: "CH",
        },
      ],
    },
    supply: {
      weightInGram: 1570,
      heightInMillimeters: 250,
      lengthInMillimeters: 300,
      widthInMillimeters: 400,
    },
  },
  {
    _id: "simple-assortment2",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: false,
    isRoot: true,
    isBase: false,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment3",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment4",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: false,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment5",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: true,
    isRoot: false,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment6",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment7",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: false,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment8",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment9",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
  {
    _id: "simple-assortment10",
    created: new Date("2019-07-30T09:23:26.253+0000"),
    type: "SIMPLE_PRODUCT",
    isActive: true,
    isRoot: true,
    isBase: true,
    sequence: 0,
    authorId: "admin",
    slugs: ["old-slug-de", "slug-de", "slug-fr"],
    updated: new Date("2019-09-10T14:29:37.015+0000"),
    published: new Date("2019-07-30T09:23:57.329+0000"),
  },
];

export const GermanAssortmentText = {
  _id: "german",
  locale: "de",
  assortmentId: "simple-assortment",
  slug: "slug-de",
  title: "simple assortment de",
  updated: new Date("2019-09-10T14:28:46.103+0000"),
  brand: "brand-de",
  description: "text-de",
  labels: ["label-de-1", "label-de-2"],
  subtitle: "subsimple assortment de",
  vendor: "vendor-de",
};

export const FrenchAssortmentText = {
  _id: "french",
  locale: "fr",
  assortmentId: "simple-assortment",
  labels: ["label-fr-1"],
  slug: "slug-fr",
  title: "title-fr",
  updated: new Date("2019-09-10T14:28:46.105+0000"),
  brand: "brand-fr-1",
  description: "text-fr-1",
  subtitle: "subtitle-fr",
  vendor: "vendor-fr-1",
};

export default async function seedAssortments(db) {
  await db.collection("assortments").insertMany(SimpleAssortment);
  await db.collection("assortment_texts").findOrInsertOne(GermanAssortmentText);
  await db.collection("assortment_texts").findOrInsertOne(FrenchAssortmentText);
}

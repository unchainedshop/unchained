export const AssortmentListResponse = {
  data: {
    assortments: [
      {
        _id: 'e38361a29cf8e3a6036c837a',
        isActive: true,
        created: '2022-03-22T13:47:05.168Z',
        updated: '2022-07-19T14:26:46.565Z',
        sequence: 12,
        texts: {
          _id: '8f7dcfdeb42f704b56248d1e',
          slug: 'snacks',
          title: 'Snacks',
          subtitle: 'Snacks',
          description: 'Snacks',
          __typename: 'AssortmentTexts',
        },
        isBase: true,
        isRoot: true,
        tags: [],
        childrenCount: 4,

        media: [
          {
            _id: 'a057db39dcd83bb5795ef38f',
            tags: [],
            file: {
              _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
              url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
              __typename: 'Media',
            },
            __typename: 'AssortmentMedia',
          },
        ],
        __typename: 'Assortment',
      },
      {
        _id: 'not-active',
        isActive: false,
        created: '2022-03-29T20:50:58.529Z',
        updated: '2022-07-19T14:26:47.723Z',
        sequence: 13,
        texts: {
          _id: '68b451c9e4b4d85a4e99de76',
          slug: 'Hamburger',
          title: 'Hamburger',
          subtitle: null,
          description: null,
          __typename: 'AssortmentTexts',
        },
        isBase: true,
        isRoot: true,
        tags: [],
        childrenCount: 4,
        linkedAssortments: [],
        media: [
          {
            _id: 'cca5d793040a97ea65652712',
            tags: [],
            file: {
              _id: '3QZoWf3lYGhboM7zGZO8ua-06_burger.jpg',
              url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/3QZoWf3lYGhboM7zGZO8ua-06_burger.jpg',
              __typename: 'Media',
            },
            __typename: 'AssortmentMedia',
          },
        ],
        __typename: 'Assortment',
      },
      {
        _id: 'not-base',
        isActive: true,
        created: '2022-04-20T14:47:53.670Z',
        updated: '2022-07-19T14:26:50.221Z',
        sequence: 17,
        texts: {
          _id: '7f04569c0eb84dd41ddd812a',
          slug: 'Sussgetranke',
          title: 'Süssgetränke',
          subtitle: null,
          description: null,
          __typename: 'AssortmentTexts',
        },
        isBase: false,
        isRoot: true,
        tags: [],
        childrenCount: 4,
        linkedAssortments: [],
        media: [
          {
            _id: '5595435cf99a9e936edce88c',
            tags: [],
            file: {
              _id: '5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
              url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
              __typename: 'Media',
            },
            __typename: 'AssortmentMedia',
          },
        ],
        __typename: 'Assortment',
      },
      {
        _id: 'not-root',
        isActive: true,
        created: '2022-06-22T07:46:19.990Z',
        updated: '2022-07-19T14:26:22.386Z',
        sequence: 21,
        texts: {
          _id: 'e98aaa56ab14e5f73708ca28',
          slug: 'bier-1',
          title: 'Bier',
          subtitle: null,
          description: null,
          __typename: 'AssortmentTexts',
        },
        isBase: true,
        isRoot: false,
        tags: [],
        linkedAssortments: [],
        childrenCount: 4,
        media: [
          {
            _id: 'd67039aa926a31d370dbdb4b',
            tags: [],
            file: {
              _id: '1MiIOTGCQoBR558YeGgx4d-01_beer.jpg',
              url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/1MiIOTGCQoBR558YeGgx4d-01_beer.jpg',
              __typename: 'Media',
            },
            __typename: 'AssortmentMedia',
          },
        ],
        __typename: 'Assortment',
      },
    ],
    assortmentsCount: 4,
  },
};

export const AssortmentChildrenResponse = {
  data: {
    assortments: [
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: '7f85efeede24415b3348697a',
        texts: {
          _id: '8ca135ed6a4d7d807c0b6765',
          slug: 'test-new-assortment',
          title: 'test new assortment',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 0,
        __typename: 'Assortment',
        children: [],
      },
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: '9c4fbb24026edd32b184cb75',
        texts: {
          _id: '3c6d7728f7fd7326b479c779',
          slug: 'assortment-again',
          title: 'assortment again',
          subtitle: 'updated assortment again',
          __typename: 'AssortmentTexts',
        },
        childrenCount: 0,
        __typename: 'Assortment',
        children: [],
      },
      {
        _id: '1b3b448f2d9433181a134491',
        texts: {
          _id: 'baab931f549b453f0545cbf9',
          slug: 'a',
          title: 'a',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 0,
        __typename: 'Assortment',
        children: [],
      },
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: '87e7aa1db0755c3963eb57cb',
        texts: {
          _id: '367587c908a2f0ef940fce92',
          slug: 'gagaga',
          title: 'gagaga',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 0,
        __typename: 'Assortment',
        children: [],
      },
    ],
  },
};

export const TranslatedAssortmentTextsResponse = {
  data: {
    translatedAssortmentTexts: [
      {
        _id: 'c0a1b807e33d2d36b2022fae',
        locale: 'en',
        slug: 'snacks',
        title: 'Snacks',
        subtitle: 'Snacks',
        description: 'Snacks',
        __typename: 'AssortmentTexts',
      },
      {
        _id: '8f7dcfdeb42f704b56248d1e',
        locale: 'de',
        slug: 'snacks',
        title: 'Snacks',
        subtitle: 'Snacks',
        description: 'Snacks',
        __typename: 'AssortmentTexts',
      },
    ],
  },
};

export const AssortmentPathsResponse = {
  data: {
    assortments: [
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: 'e38361a29cf8e3a6036c837a',
        texts: {
          _id: '8f7dcfdeb42f704b56248d1e',
          slug: 'snacks',
          title: 'Snacks',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 4,
        __typename: 'Assortment',
        children: [],
      },
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: '1fed9af2ed7fd71548955f6d',
        texts: {
          _id: '68b451c9e4b4d85a4e99de76',
          slug: 'Hamburger',
          title: 'Hamburger',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 4,
        __typename: 'Assortment',
        children: [],
      },
      {
        _id: 'e66542656a6887e64d0d7cb9',
        texts: {
          _id: '7f04569c0eb84dd41ddd812a',
          slug: 'Süssgetränke',
          title: 'Süssgetränke',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 4,
        __typename: 'Assortment',
        children: [],
      },
      {
        ...AssortmentListResponse.data?.assortments[0],
        _id: '0de23bbadc6a2d8da8a73a98',
        texts: {
          _id: 'e98aaa56ab14e5f73708ca28',
          slug: 'bier-1',
          title: 'Bier',
          subtitle: null,
          __typename: 'AssortmentTexts',
        },
        childrenCount: 4,
        __typename: 'Assortment',
        children: [],
      },
    ],
  },
};

export const Createassortmentesponse = {
  data: {
    createAssortment: {
      ...AssortmentListResponse.data?.assortments[0],
      _id: 'e38361a29cf8e3a6036c837a',
      texts: {
        _id: '8f7dcfdeb42f704b56248d1e',
        slug: 'snacks',
        __typename: 'AssortmentTexts',
      },
      __typename: 'Assortment',
    },
  },
};

export const Updateassortmentesponse = {
  data: {
    updateAssortment: {
      ...AssortmentListResponse.data?.assortments[0],
      _id: 'e38361a29cf8e3a6036c837a',
      __typename: 'Assortment',
    },
  },
};

export const Singleassortmentesponse = {
  data: {
    assortment: {
      ...AssortmentListResponse.data?.assortments[0],
      _id: 'e38361a29cf8e3a6036c837a',
      isActive: true,
      created: '2022-03-22T13:47:05.168Z',
      updated: '2022-07-19T14:26:46.565Z',
      sequence: 12,
      texts: {
        _id: '8f7dcfdeb42f704b56248d1e',
        slug: 'snacks',
        title: 'Snacks',
        subtitle: 'Snacks',
        description: 'Snacks',
        __typename: 'AssortmentTexts',
      },
      isBase: true,
      isRoot: true,
      tags: [],
      childrenCount: 4,
      media: [
        {
          _id: 'a057db39dcd83bb5795ef38f',
          tags: [],
          file: {
            _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
            url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
            __typename: 'Media',
          },
          __typename: 'AssortmentMedia',
        },
      ],
      __typename: 'Assortment',
    },
  },
};

export const SetBaseassortmentesponse = {
  data: {
    setBaseAssortment: {
      ...AssortmentListResponse.data?.assortments[0],
      _id: 'e38361a29cf8e3a6036c837a',
      __typename: 'Assortment',
    },
  },
};

export const UpdateAssortmentTextsResponse = {
  data: {
    updateAssortmentTexts: [
      {
        _id: 'e38361a29cf8e3a6036c837a',
        __typename: 'AssortmentTexts',
      },
    ],
  },
};

export const AssortmentLinksResponse = {
  data: {
    assortment: {
      ...AssortmentListResponse.data?.assortments[0],
      _id: 'e38361a29cf8e3a6036c837a',
      linkedAssortments: [
        {
          _id: '7336cc61081c8b0e770dca64',
          parent: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: 'e38361a29cf8e3a6036c837a',
            isActive: true,
            created: '2022-03-22T13:47:05.168Z',
            updated: '2022-07-19T14:26:46.565Z',
            sequence: 12,
            texts: {
              _id: '8f7dcfdeb42f704b56248d1e',
              slug: 'snacks',
              title: 'Snacks',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: 'a057db39dcd83bb5795ef38f',
                tags: [],
                file: {
                  _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          child: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: '1fed9af2ed7fd71548955f6d',
            isActive: true,
            created: '2022-03-29T20:50:58.529Z',
            updated: '2022-07-19T14:26:47.723Z',
            sequence: 13,
            texts: {
              _id: '68b451c9e4b4d85a4e99de76',
              slug: 'Hamburger',
              title: 'Hamburger',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: 'cca5d793040a97ea65652712',
                tags: [],
                file: {
                  _id: '3QZoWf3lYGhboM7zGZO8ua-06_burger.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/3QZoWf3lYGhboM7zGZO8ua-06_burger.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          __typename: 'AssortmentLink',
        },
        {
          _id: '732cda0142e9f3def79159e0',
          parent: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: '0de23bbadc6a2d8da8a73a98',
            isActive: true,
            created: '2022-06-22T07:46:19.990Z',
            updated: '2022-07-19T14:26:22.386Z',
            sequence: 21,
            texts: {
              _id: 'e98aaa56ab14e5f73708ca28',
              slug: 'bier-1',
              title: 'Bier',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: 'd67039aa926a31d370dbdb4b',
                tags: [],
                file: {
                  _id: '1MiIOTGCQoBR558YeGgx4d-01_beer.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/1MiIOTGCQoBR558YeGgx4d-01_beer.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          child: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: 'e38361a29cf8e3a6036c837a',
            isActive: true,
            created: '2022-03-22T13:47:05.168Z',
            updated: '2022-07-19T14:26:46.565Z',
            sequence: 12,
            texts: {
              _id: '8f7dcfdeb42f704b56248d1e',
              slug: 'snacks',
              title: 'Snacks',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: 'a057db39dcd83bb5795ef38f',
                tags: [],
                file: {
                  _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          __typename: 'AssortmentLink',
        },
        {
          _id: '9b4e142553dc5b60465e565b',
          parent: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: 'e38361a29cf8e3a6036c837a',
            isActive: true,
            created: '2022-03-22T13:47:05.168Z',
            updated: '2022-07-19T14:26:46.565Z',
            sequence: 12,
            texts: {
              _id: '8f7dcfdeb42f704b56248d1e',
              slug: 'snacks',
              title: 'Snacks',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: 'a057db39dcd83bb5795ef38f',
                tags: [],
                file: {
                  _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          child: {
            ...AssortmentListResponse.data?.assortments[0],
            _id: 'e66542656a6887e64d0d7cb9',
            isActive: true,
            created: '2022-04-20T14:47:53.670Z',
            updated: '2022-07-19T14:26:50.221Z',
            sequence: 17,
            texts: {
              _id: '7f04569c0eb84dd41ddd812a',
              slug: 'Süssgetränke',
              title: 'Süssgetränke',
              subtitle: null,
              description: null,
              __typename: 'AssortmentTexts',
            },
            isBase: false,
            isRoot: true,
            tags: [],
            childrenCount: 4,
            media: [
              {
                _id: '5595435cf99a9e936edce88c',
                tags: [],
                file: {
                  _id: '5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
                  __typename: 'Media',
                },
                __typename: 'AssortmentMedia',
              },
            ],
            __typename: 'Assortment',
          },
          __typename: 'AssortmentLink',
        },
      ],
      __typename: 'Assortment',
    },
  },
};

export const SearchAssortmentsResponse = {
  data: {
    searchAssortments: {
      assortments: [
        {
          ...AssortmentListResponse.data?.assortments[0],
          _id: 'e66542656a6887e64d0d7cb9',
          isActive: true,
          created: '2022-04-20T14:47:53.670Z',
          updated: '2022-07-19T14:26:50.221Z',
          sequence: 17,
          texts: {
            _id: '7f04569c0eb84dd41ddd812a',
            slug: 'Süssgetränke',
            title: 'Süssgetränke',
            subtitle: null,
            description: null,
            __typename: 'AssortmentTexts',
          },
          isBase: false,
          isRoot: true,
          tags: [],
          childrenCount: 4,
          media: [
            {
              _id: '5595435cf99a9e936edce88c',
              tags: [],
              file: {
                _id: '5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
                url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/5atbwLOqPVJZatoh45CFAk-02_popsoda.jpg',
                __typename: 'Media',
              },
              __typename: 'AssortmentMedia',
            },
          ],
          __typename: 'Assortment',
        },
      ],
      __typename: 'AssortmentSearchResult',
    },
  },
};

export const AddAssortmentLinkResponse = {
  data: {
    addAssortmentLink: {
      _id: '9b4e142553dc5b60465e565b',
      __typename: 'AssortmentLink',
    },
  },
};

export const RemoveAssortmentLinkResponse = {
  data: {
    removeAssortmentLink: {
      _id: '04b3a331f450f5ba31d1f5ea',
      __typename: 'AssortmentLink',
    },
  },
};

export const AssortmentMediaResponse = {
  data: {
    assortment: {
      _id: 'snacks',
      media: [
        {
          _id: 'a057db39dcd83bb5795ef38f',
          tags: [],
          texts: null,
          file: {
            _id: '26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
            url: 'https://orderly.xn--nd-fka.live/gridfs/assortment-media/26iqNJ2HWF5bI6Tpz5i7JW-07_snacks.jpg',
            name: '07_snacks.jpg',
            size: 89583,
            type: 'image/jpeg',
            __typename: 'Media',
          },
          sortKey: 1,
          __typename: 'AssortmentMedia',
        },
      ],
      __typename: 'Assortment',
    },
  },
};

export const TranslatedAssortmentMediaTextsResponse = {
  data: {
    translatedAssortmentMediaTexts: [
      {
        _id: 'f4f14c69de872a515f48dcc7',
        locale: 'en',
        title: 'moniter',
        subtitle: 'moniter',
        __typename: 'AssortmentMediaTexts',
      },
      {
        _id: '5eac9ac1a125b74ce7816b3b',
        locale: 'de',
        title: 'moniter',
        subtitle: 'moniter',
        __typename: 'AssortmentMediaTexts',
      },
    ],
  },
};

export const RemoveAssortmentMediaResponse = {
  data: {
    removeAssortmentMedia: {
      _id: 'f4f14c69de872a515f48dcc7',
      __typename: 'AssortmentMedia',
    },
  },
};

export const UpdateAssortmentMediaTextsResponse = {
  data: {
    updateAssortmentMediaTexts: [
      {
        _id: '5eac9ac1a125b74ce7816b3b',
        __typename: 'AssortmentMediaTexts',
      },
    ],
  },
};

export const AssortmentProductsResponse = {
  data: {
    assortment: {
      _id: 'e38361a29cf8e3a6036c837a',
      productAssignments: [
        {
          _id: 'fee3ae6e702679cde6f0f1aa',
          sortKey: 1,
          tags: [],
          product: {
            _id: 'da14952a433f1c48ba092a8e',
            sequence: 1,
            status: 'ACTIVE',
            tags: ['popular'],
            updated: '2022-06-21T14:03:44.332Z',
            published: '2022-06-21T14:02:33.074Z',
            texts: {
              _id: '1d08f4f5516ec3c7d4b6f935',
              slug: 'pommes-frites',
              title: 'Pommes frites',
              subtitle: null,
              description: null,
              vendor: null,
              brand: null,
              labels: null,
              __typename: 'ProductTexts',
            },
            media: [
              {
                _id: '9a61b8619dda1bf91fa67a89',
                tags: [],
                file: {
                  _id: '7sHT7jxTATrAgMNdrf5w92-thumbnail_pommes.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/7sHT7jxTATrAgMNdrf5w92-thumbnail_pommes.jpg',
                  __typename: 'Media',
                },
                __typename: 'ProductMedia',
              },
            ],
            reviews: [],
            __typename: 'SimpleProduct',
          },
          __typename: 'AssortmentProduct',
        },
        {
          _id: 'd9906ee2139a4ff3e60716cb',
          sortKey: 2,
          tags: [],
          product: {
            _id: 'c91f610f6daf24ddb13fdee9',
            sequence: 1,
            status: 'ACTIVE',
            tags: ['popular'],
            updated: '2022-06-16T14:11:47.359Z',
            published: '2022-04-20T12:12:30.677Z',
            texts: {
              _id: '33c20753a0ba4bb90cef3ab2',
              slug: 'chicken-nuggets',
              title: 'Chicken Nuggets',
              subtitle: null,
              description: null,
              vendor: null,
              brand: null,
              labels: null,
              __typename: 'ProductTexts',
            },
            media: [
              {
                _id: '37729d254cf2781300c8a4c8',
                tags: [],
                file: {
                  _id: '7vfWmbKD8Gxdfvh0EpHcoC-thumbnail_fisch.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/7vfWmbKD8Gxdfvh0EpHcoC-thumbnail_fisch.jpg',
                  __typename: 'Media',
                },
                __typename: 'ProductMedia',
              },
            ],
            reviews: [],
            __typename: 'SimpleProduct',
          },
          __typename: 'AssortmentProduct',
        },
        {
          _id: 'dd2a0841af3e4e081f47061c',
          sortKey: 3,
          tags: [],
          product: {
            _id: 'f1a6fc2f97c3593fb1e69777',
            sequence: 48,
            status: 'ACTIVE',
            tags: [],
            updated: '2022-04-20T12:20:56.274Z',
            published: '2022-04-20T12:20:56.274Z',
            texts: {
              _id: '5d1c28ff198cea8606a979dd',
              slug: 'meat-balls-vegetarisch-falafel',
              title: 'Meat Balls Vegetarisch / Falafel',
              subtitle: null,
              description: null,
              vendor: null,
              brand: null,
              labels: null,
              __typename: 'ProductTexts',
            },
            media: [],
            reviews: [],
            __typename: 'SimpleProduct',
          },
          __typename: 'AssortmentProduct',
        },
        {
          _id: '7e2c4b4928de4143ae772b29',
          sortKey: 4,
          tags: [],
          product: {
            _id: '82801617c8350ae3c8ed087a',
            sequence: 50,
            status: 'ACTIVE',
            tags: [],
            updated: '2022-06-23T15:15:27.113Z',
            published: '2022-06-23T15:15:27.113Z',
            texts: {
              _id: 'a24d003ca35fef3795ebc15b',
              slug: 'salad-bowls',
              title: 'Salad Bowls',
              subtitle: null,
              description: null,
              vendor: null,
              brand: null,
              labels: null,
              __typename: 'ProductTexts',
            },
            media: [
              {
                _id: '1b8692f8b18bdfc5e5e0342b',
                tags: [],
                file: {
                  _id: '73Rksm0KvkEqvUI2kfQ4T5-thumbnail_salad.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/73Rksm0KvkEqvUI2kfQ4T5-thumbnail_salad.jpg',
                  __typename: 'Media',
                },
                __typename: 'ProductMedia',
              },
            ],
            reviews: [],
            __typename: 'SimpleProduct',
          },
          __typename: 'AssortmentProduct',
        },
      ],
      __typename: 'Assortment',
    },
  },
};

export const SearchProductsResponse = {
  data: {
    searchProducts: {
      productsCount: 2,
      filteredProductsCount: 2,
      products: [
        {
          _id: 'da14952a433f1c48ba092a8e',
          sequence: 1,
          status: 'ACTIVE',
          tags: ['popular'],
          updated: '2022-06-21T14:03:44.332Z',
          published: '2022-06-21T14:02:33.074Z',
          texts: {
            _id: '1d08f4f5516ec3c7d4b6f935',
            slug: 'pommes-frites',
            title: 'Pommes frites',
            subtitle: null,
            description: null,
            vendor: null,
            brand: null,
            labels: null,
            __typename: 'ProductTexts',
          },
          media: [
            {
              _id: '9a61b8619dda1bf91fa67a89',
              tags: [],
              file: {
                _id: '7sHT7jxTATrAgMNdrf5w92-thumbnail_pommes.jpg',
                url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/7sHT7jxTATrAgMNdrf5w92-thumbnail_pommes.jpg',
                __typename: 'Media',
              },
              __typename: 'ProductMedia',
            },
          ],
          reviews: [],
          __typename: 'SimpleProduct',
        },
        {
          _id: 'cheeseburger',
          sequence: 14,
          status: 'ACTIVE',
          tags: ['popular', 'swiss-tax-category:reduced'],
          updated: '2022-06-22T08:46:10.645Z',
          published: '2022-05-24T18:17:43.109Z',
          texts: {
            _id: 'deaa4ef7d20a8e8d0d3150d4',
            slug: 'cheeseburger',
            title: 'Cheeseburger mit Pommes-Frites',
            subtitle: null,
            description: '<p>Schweizer Fleisch</p>',
            vendor: 'Burger Meister',
            brand: 'Fat & Toasty',
            labels: [],
            __typename: 'ProductTexts',
          },
          media: [
            {
              _id: '052ffb386e17bd1a1e637cdd',
              tags: [],
              file: {
                _id: '3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                __typename: 'Media',
              },
              __typename: 'ProductMedia',
            },
          ],
          reviews: [],
          __typename: 'SimpleProduct',
        },
      ],
      __typename: 'ProductSearchResult',
    },
  },
};

export const AddAssortmentProductResponse = {
  data: {
    addAssortmentProduct: {
      _id: 'da14952a433f1c48ba092a8e',
      __typename: 'AssortmentProduct',
    },
  },
};

export const RemoveAssortmentProductResponse = {
  data: {
    removeAssortmentProduct: {
      _id: 'e38361a29cf8e3a6036c837a',
      __typename: 'AssortmentProduct',
    },
  },
};

export const FiltersListResponse = {
  data: {
    filtersCount: 3,
    filters: [
      {
        _id: '9578c8348c354fa34b98fce7',
        key: 'color',
        isActive: true,
        texts: {
          _id: '166f4510bba04f6263a356af',
          title: 'some title',
          subtitle: null,
          locale: 'de',
          __typename: 'FilterTexts',
        },
        type: 'SINGLE_CHOICE',
        updated: '2022-07-23T11:45:51.809Z',
        created: '2022-07-23T11:45:47.228Z',
        options: [],
        __typename: 'Filter',
      },
      {
        _id: '2ec75fcfc72795c9cff29740',
        key: 'size',
        isActive: true,
        texts: {
          _id: '2a46fe90e5181c92b9731081',
          title: 'By color',
          subtitle: null,
          locale: 'de',
          __typename: 'FilterTexts',
        },
        type: 'MULTI_CHOICE',
        options: [],
        updated: '2022-07-23T11:45:51.809Z',
        created: '2022-07-23T11:45:47.228Z',
        __typename: 'Filter',
      },
    ],
  },
};

export const AssortmentFiltersResponse = {
  data: {
    assortment: {
      _id: 'e38361a29cf8e3a6036c837a',
      filterAssignments: [
        {
          _id: '96eabe8bf4e195962a4dd569',
          sortKey: 1,
          tags: [],
          filter: {
            _id: '9578c8348c354fa34b98fce7',
            updated: '2022-07-23T11:45:09.648Z',
            created: '2022-07-23T11:44:40.298Z',
            key: 'color',
            isActive: true,
            type: 'SINGLE_CHOICE',
            options: [
              {
                _id: '9578c8348c354fa34b98fce7:some',
                texts: null,
                value: 'some',
                __typename: 'FilterOption',
              },
              {
                _id: '9578c8348c354fa34b98fce7:title',
                texts: null,
                value: 'title',
                __typename: 'FilterOption',
              },
            ],
            __typename: 'Filter',
          },
          __typename: 'AssortmentFilter',
        },
        {
          _id: '48150ba46e9b54d18a83f8ff',
          sortKey: 2,
          tags: [],
          filter: {
            _id: '2ec75fcfc72795c9cff29740',
            updated: '2022-07-23T11:45:51.809Z',
            created: '2022-07-23T11:45:47.228Z',
            key: 'size',
            isActive: true,
            type: 'MULTI_CHOICE',
            options: [
              {
                _id: '2ec75fcfc72795c9cff29740:some',
                texts: null,
                value: 'some',
                __typename: 'FilterOption',
              },
            ],
            __typename: 'Filter',
          },
          __typename: 'AssortmentFilter',
        },
      ],
      __typename: 'Assortment',
    },
  },
};

export const AddAssortmentFilterResponse = {
  data: {
    addAssortmentFilter: {
      _id: 'e38361a29cf8e3a6036c837a',
      __typename: 'AssortmentFilter',
    },
  },
};

export const RemoveAssortmentFilterResponse = {
  data: {
    removeAssortmentFilter: {
      _id: 'e38361a29cf8e3a6036c837a',
      __typename: 'AssortmentFilter',
    },
  },
};

export const assortmentequestVariables = {
  includeInactive: true,
  includeLeaves: false,
  limit: 50,
  offset: 0,
  queryString: '',
  slugs: null,
  sort: [
    {
      key: 'sequence',
      value: 'ASC',
    },
  ],
  tags: null,
};

export const AssortmentOperation = {
  GetAssortmentList: 'Assortments',
  GetAssortmentChildren: 'AssortmentChildren',
  GetSingleAssortment: 'Assortment',
  GetAssortmentPaths: 'AssortmentPaths',
  GetTranslatedTexts: 'TranslatedAssortmentTexts',
  CreateAssortment: 'CreateAssortment',
  UpdateAssortment: 'UpdateAssortment',
  SetBaseAssortment: 'SetBaseAssortment',
  UpdateAssortmentTexts: 'updateAssortmentTexts',
  GetAssortmentLinks: 'AssortmentLinks',
  SearchAssortments: 'SearchAssortments',
  AddAssortmentLink: 'AddAssortmentLink',
  RemoveAssortmentLink: 'RemoveAssortmentLink',
  AssortmentMedia: 'AssortmentMedia',
  GetMediaTexts: 'TranslatedAssortmentMediaTexts',
  RemoveMedia: 'RemoveAssortmentMedia',
  UpdateMediaTexts: 'UpdateAssortmentMediaTexts',
  AssortmentProducts: 'AssortmentProducts',
  SearchProducts: 'SearchProducts',
  AddProduct: 'AddAssortmentProduct',
  RemoveProduct: 'RemoveAssortmentProduct',
  FiltersList: 'Filters',
  AssortmentFilters: 'AssortmentFilters',
  RemoveFilter: 'RemoveAssortmentFilter',
  AddFilter: 'AddAssortmentFilter',
};

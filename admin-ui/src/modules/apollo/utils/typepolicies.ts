import { offsetLimitPagination } from '@apollo/client/utilities';

const keyMappings: any = {
  // UserEmail has no id, so it is stored non-normalized inside User. Different
  // queries select it with different fields (e.g. with/without `verified`);
  // merge them field-wise so cached data is not dropped on partial refetches.
  UserEmail: {
    merge: true,
  },
  Query: {
    fields: {
      assortments: {
        ...offsetLimitPagination([
          'includeLeaves',
          'includeInactive',
          'tags',
          'queryString',
          'slugs',
          'limit',
        ]),
      },
      products: {
        ...offsetLimitPagination([
          'includeDrafts',
          'tags',
          'queryString',
          'sort',
          'limit',
        ]),
      },
      product: {
        keyArgs: ['productId', 'slug'],
        fields: {
          reviews: offsetLimitPagination(),
        },
      },
      user: {
        keyArgs: ['userId'],
        fields: {
          reviews: offsetLimitPagination(),
        },
      },
      countries: {
        ...offsetLimitPagination([
          'includeInactive',
          'queryString',
          'sort',
          'limit',
        ]),
      },
      currencies: {
        ...offsetLimitPagination([
          'includeInactive',
          'queryString',
          'sort',
          'limit',
        ]),
      },
      enrollments: {
        ...offsetLimitPagination(['queryString', 'status', 'sort', 'limit']),
      },
      quotations: {
        ...offsetLimitPagination(['queryString', 'sort', 'limit']),
      },
      workQueue: {
        ...offsetLimitPagination([
          'status',
          'types',
          'created',
          'queryString',
          'limit',
        ]),
      },
      languages: {
        ...offsetLimitPagination([
          'includeInactive',
          'queryString',
          'sort',
          'limit',
        ]),
      },
      events: {
        ...offsetLimitPagination([
          'types',
          'queryString',
          'sort',
          'limit',
          'created',
        ]),
      },
      users: {
        ...offsetLimitPagination([
          'includeGuests',
          'queryString',
          'emailVerified',
          'lastLogin',
          'limit',
          'tags',
        ]),
      },
      filters: {
        ...offsetLimitPagination([
          'queryString',
          'includeInactive',
          'sort',
          'limit',
        ]),
      },
      orders: {
        ...offsetLimitPagination([
          'includeCarts',
          'queryString',
          'sort',
          'limit',
          'dateRange',
          'status',
          'deliveryProviderIds',
          'paymentProviderIds',
        ]),
      },
    },
  },
};

const keyFields: any = {
  keyFields: (result: any) => {
    if (result?._id && result?.__typename) {
      return `${result?.__typename}:${result?._id}`;
    }
    if (result?.id && result?.__typename) {
      return `${result.__typename}:${result.id}`;
    }
    return null;
  },
};

const typePolicies = { ...keyMappings, ...keyFields };

export default typePolicies;

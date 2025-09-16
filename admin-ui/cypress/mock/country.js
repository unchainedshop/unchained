export const CountryListResponse = {
  data: {
    countries: [
      {
        _id: '2c134c37930db24fc9badcb2',
        isoCode: 'CH',
        isActive: true,
        isBase: true,
        defaultCurrency: {
          _id: '54113f9f8d80b4edb0dc3447',
          isoCode: 'CHF',
          __typename: 'Currency',
        },
        __typename: 'Country',
      },
      {
        _id: '075eba0a726acb6bea88d420',
        isoCode: 'DE',
        isActive: true,
        isBase: false,
        defaultCurrency: {
          _id: '54113f9f8d80b4edb0dc3447',
          isoCode: 'CHF',
          __typename: 'Currency',
        },
        __typename: 'Country',
      },
    ],
    countriesCount: 2,
  },
};

export const SingleCountryResponse = {
  data: {
    country: {
      _id: '2c134c37930db24fc9badcb2',
      isoCode: 'CH',
      isActive: true,
      isBase: true,
      defaultCurrency: {
        _id: '54113f9f8d80b4edb0dc3447',
        isoCode: 'CHF',
        __typename: 'Currency',
      },
      __typename: 'Country',
    },
  },
};

export const CreateCountryResponse = {
  data: {
    createCountry: {
      _id: 'e2b0b1852edbe9697f02c38b',
      __typename: 'Country',
    },
  },
};

export const UpdateCountryResponse = {
  data: {
    updateCountry: {
      _id: 'e2b0b1852edbe9697f02c38b',
      __typename: 'Country',
    },
  },
};

export const RemoveCountryResponse = {
  data: {
    removeCountry: {
      _id: '2c134c37930db24fc9badcb2',
      __typename: 'Country',
    },
  },
};

export const CountryOperations = {
  GetCountryList: 'Countries',
  GetSingleCountry: 'Country',
  CreateCountry: 'CreateCountry',
  UpdateCountry: 'UpdateCountry',
  RemoveCountry: 'RemoveCountry',
};

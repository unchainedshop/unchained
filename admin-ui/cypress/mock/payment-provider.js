export const PaymentProvidersListResponse = {
  data: {
    paymentProviders: [
      {
        _id: 'ca246b09cf48cc2ef249a549',
        created: '2022-04-11T14:36:45.096Z',
        updated: '2022-05-23T15:04:45.648Z',
        deleted: null,
        isActive: true,
        type: 'GENERIC',
        interface: {
          _id: 'shop.unchained.datatrans',
          label: 'Datatrans (https://docs.datatrans.ch)',
          version: '2.0.0',
          __typename: 'PaymentInterface',
        },
        configuration: [
          {
            key: 'merchantId',
            value: '1100035415',
          },
          {
            key: 'testCommission',
            value: '5',
          },
          {
            key: 'testService',
            value: '2',
          },
          {
            key: 'marketplaceSplit',
            value: '19977;ch.test.discount.remove-test-fee',
          },
        ],
        configurationError: null,
        __typename: 'PaymentProvider',
      },
    ],
  },
};

export const SinglePaymentProviderResponse = {
  data: {
    paymentProvider: {
      _id: 'ca246b09cf48cc2ef249a549',
      created: '2022-04-11T14:36:45.096Z',
      updated: '2022-05-23T15:04:45.648Z',
      deleted: null,
      isActive: true,
      type: 'GENERIC',
      interface: {
        _id: 'shop.unchained.datatrans',
        label: 'Datatrans (https://docs.datatrans.ch)',
        version: '2.0.0',
        __typename: 'PaymentInterface',
      },
      configuration: [
        {
          key: 'merchantId',
          value: '1100035415',
        },
        {
          key: 'testCommission',
          value: '5',
        },
        {
          key: 'testService',
          value: '2',
        },
        {
          key: 'marketplaceSplit',
          value: '19977;ch.test.discount.remove-test-fee',
        },
      ],
      configurationError: null,
      __typename: 'PaymentProvider',
    },
  },
};

export const UpdatePaymentProviderResponse = {
  data: {
    paymentProvider: {
      _id: 'ca246b09cf48cc2ef249a549',
      created: '2022-04-11T14:36:45.096Z',
      updated: '2022-05-23T15:04:45.648Z',
      deleted: null,
      isActive: true,
      type: 'GENERIC',
      interface: {
        _id: 'shop.unchained.datatrans',
        label: 'Datatrans (https://docs.datatrans.ch)',
        version: '2.0.0',
        __typename: 'PaymentInterface',
      },
      configuration: [
        {
          key: 'merchantId',
          value: '1100035415',
        },
        {
          key: 'testCommission',
          value: '5',
        },
        {
          key: 'testService',
          value: '2',
        },
        {
          key: 'marketplaceSplit',
          value: '19977;ch.test.discount.remove-test-fee',
        },
      ],
      configurationError: null,
      __typename: 'PaymentProvider',
    },
  },
};

export const PaymentProvidersTypeResponse = {
  data: {
    paymentProviderType: {
      options: [
        {
          value: 'CARD',
          label: 'Card',
          __typename: '__EnumValue',
        },
        {
          value: 'INVOICE',
          label: 'Invoice',
          __typename: '__EnumValue',
        },
        {
          value: 'GENERIC',
          label: 'Generic',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
    },
  },
};

export const PaymentProvidersInterfaceResponse = {
  data: {
    paymentInterfaces: [
      {
        _id: 'shop.unchained.datatrans',
        value: 'shop.unchained.datatrans',
        label: 'Datatrans (https://docs.datatrans.ch)',
        __typename: 'PaymentInterface',
      },
    ],
  },
};

export const CreatePaymentProviderResponse = {
  data: {
    createPaymentProvider: {
      _id: '2b5727d79d2a8e56b957719e',
      __typename: 'PaymentProvider',
    },
  },
};

export const RemovePaymentProviderResponse = {
  data: {
    removePaymentProvider: {
      _id: 'ca246b09cf48cc2ef249a549',
      __typename: 'PaymentProvider',
    },
  },
};

export const PaymentProviderOperations = {
  GetProvidersList: 'PaymentProviders',
  GetSingleProvider: 'PaymentProvider',
  GetProvidersType: 'PaymentProvidersType',
  GetInterfaces: 'PaymentInterfaces',
  CreateProvider: 'CreatePaymentProvider',
  UpdateProvider: 'UpdatePaymentProvider',
  RemoveProvider: 'RemovePaymentProvider',
};

const PaymentProviderMocks = {
  PaymentProviderOperations,
  PaymentProvidersInterfaceResponse,
  PaymentProvidersListResponse,
  PaymentProvidersTypeResponse,
  SinglePaymentProviderResponse,
  CreatePaymentProviderResponse,
};

export default PaymentProviderMocks;

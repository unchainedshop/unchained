export const WarehousingProvidersListResponse = {
  data: {
    warehousingProviders: [
      {
        _id: '0167c4fde8e06c54f26532a2',
        created: '2022-03-17T11:43:35.495Z',
        updated: '2022-07-11T08:42:22.298Z',
        deleted: null,
        isActive: true,
        type: 'PHYSICAL',
        interface: {
          _id: 'ch.test.clerk',
          label: 'Imbissstand',
          version: '1.0',
          __typename: 'WarehousingInterface',
        },
        configuration: [
          {
            key: 'sector',
            value: 'A',
          },
          {
            key: 'online',
            value: 'true',
          },
          {
            key: 'available_delivery_provider',
            value: 'runner',
          },
          {
            key: 'available_delivery_provider',
            value: 'pickup',
          },
        ],
        configurationError: null,
        __typename: 'WarehousingProvider',
      },
      {
        _id: '27fd3343a04758f31100c01b',
        created: '2022-06-23T11:38:09.649Z',
        updated: '2022-07-10T23:16:04.810Z',
        deleted: null,
        isActive: false,
        type: 'PHYSICAL',
        interface: {
          _id: 'ch.test.clerk',
          label: 'Imbissstand',
          version: '1.0',
          __typename: 'WarehousingInterface',
        },
        configuration: [
          {
            key: 'sector',
            value: 'B',
          },
          {
            key: 'online',
            value: 'false',
          },
          {
            key: 'add_disabled_product_id',
            value: 'e0e09639778d25e94f64284c',
          },
        ],
        configurationError: null,
        __typename: 'WarehousingProvider',
      },
    ],
  },
};

export const SingleWarehousingProviderResponse = {
  data: {
    warehousingProvider: {
      _id: '0167c4fde8e06c54f26532a2',
      created: '2022-03-17T11:43:35.495Z',
      updated: '2022-07-11T08:42:22.298Z',
      deleted: null,
      isActive: true,
      type: 'PHYSICAL',
      interface: {
        _id: 'ch.test.clerk',
        label: 'Imbissstand',
        version: '1.0',
        __typename: 'WarehousingInterface',
      },
      configuration: [
        {
          key: 'sector',
          value: 'A',
        },
        {
          key: 'online',
          value: 'true',
        },
        {
          key: 'available_delivery_provider',
          value: 'runner',
        },
        {
          key: 'available_delivery_provider',
          value: 'pickup',
        },
      ],
      configurationError: null,
      __typename: 'WarehousingProvider',
    },
  },
};

export const UpdateWarehousingProviderResponse = {
  data: {
    warehousingProvider: {
      _id: '0167c4fde8e06c54f26532a2',
      created: '2022-03-17T11:43:35.495Z',
      updated: '2022-07-11T08:42:22.298Z',
      deleted: null,
      isActive: true,
      type: 'PHYSICAL',
      interface: {
        _id: 'ch.test.clerk',
        label: 'Imbissstand',
        version: '1.0',
        __typename: 'WarehousingInterface',
      },
      configuration: [
        {
          key: 'sector',
          value: 'A',
        },
        {
          key: 'online',
          value: 'true',
        },
        {
          key: 'available_delivery_provider',
          value: 'runner',
        },
        {
          key: 'available_delivery_provider',
          value: 'pickup',
        },
      ],
      configurationError: null,
      __typename: 'WarehousingProvider',
    },
  },
};

export const WarehousingProvidersTypeResponse = {
  data: {
    warehousingProviderType: {
      options: [
        {
          value: 'PHYSICAL',
          label: 'Physical',
          __typename: '__EnumValue',
        },
        {
          value: 'VIRTUAL',
          label: 'Virtual',
          __typename: '__EnumValue',
        },
      ],

      __typename: '__Type',
    },
  },
};

export const WarehousingProviderInterfacesResponse = {
  data: {
    warehousingInterfaces: [
      {
        _id: 'ch.test.clerk',
        value: 'ch.test.clerk',
        label: 'Imbissstand',
        __typename: 'WarehousingInterface',
      },
    ],
  },
};

export const CreateWarehousingProviderResponse = {
  data: {
    createWarehousingProvider: {
      _id: '2a08d2e5c3285356384234c1',
      __typename: 'WarehousingProvider',
    },
  },
};

export const RemoveWarehousingProviderResponse = {
  data: {
    removeWarehousingProvider: {
      _id: '2a08d2e5c3285356384234c1',
      __typename: 'WarehousingProvider',
    },
  },
};

export const WarehousingProviderOperations = {
  GetProvidersList: 'WarehousingProviders',
  GetSingleProvider: 'WarehousingProvider',
  GetProvidersType: 'WarehousingProvidersType',
  GetInterfaces: 'WarehousingInterfaces',
  CreateProvider: 'CreateWarehousingProvider',
  UpdateProvider: 'UpdateWarehousingProvider',
  RemoveProvider: 'RemoveWarehousingProvider',
  GetPickUpWarehousingProviders: 'GetPickUpWarehousingProviders',
};

const WarehousingProviderMocks = {
  WarehousingProviderInterfacesResponse,
  WarehousingProviderOperations,
  WarehousingProvidersListResponse,
  SingleWarehousingProviderResponse,
  WarehousingProvidersTypeResponse,
  CreateWarehousingProviderResponse,
};

export default WarehousingProviderMocks;

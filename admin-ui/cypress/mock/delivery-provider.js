export const DeliveryProviderListResponse = {
  data: {
    deliveryProviders: [
      {
        _id: 'pickup',
        created: '2022-03-17T11:28:39.047Z',
        updated: null,
        deleted: null,
        type: 'PICKUP',
        isActive: true,
        configuration: [],
        interface: {
          _id: 'ch.test.delivery.pickup',
          label: 'Pickup at Clerk',
          version: '1.0',
          __typename: 'DeliveryInterface',
        },
        configurationError: null,
        __typename: 'DeliveryProvider',
      },
      {
        _id: 'runner',
        created: '2022-03-17T11:28:39.050Z',
        updated: '2022-04-12T10:05:29.846Z',
        deleted: null,
        type: 'PICKUP',
        isActive: true,
        configuration: [
          {
            key: 'fee-amount',
            value: '100',
          },
        ],
        interface: {
          _id: 'ch.test.delivery.runner',
          label: 'Delivery through Runner',
          version: '1.0',
          __typename: 'DeliveryInterface',
        },
        configurationError: null,
        __typename: 'DeliveryProvider',
      },
    ],
  },
};

export const SingleDeliveryProviderResponse = {
  data: {
    deliveryProvider: {
      _id: 'pickup',
      created: '2022-07-08T05:59:37.885Z',
      updated: '2022-07-12T07:55:43.446Z',
      deleted: null,
      type: 'PICKUP',
      isActive: true,
      configuration: [
        {
          key: 'from',
          value: 'noreply@unchained.local',
        },
        {
          key: 'to',
          value: 'orders@unchained.local',
        },
      ],
      interface: {
        _id: 'ch.test.delivery.pickup',
        label: 'Pickup at Clerk',
        version: '1.0',
        __typename: 'DeliveryInterface',
      },
      configurationError: null,
      __typename: 'DeliveryProvider',
    },
  },
};

export const DeliveryProvidersTypeResponse = {
  data: {
    deliveryProviderType: {
      options: [
        {
          value: 'PICKUP',
          label: 'Pick-Up',
          __typename: '__EnumValue',
        },
        {
          value: 'SHIPPING',
          label: 'Shipping',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
    },
  },
};

export const DeliveryProviderPickUpInterfaces = {
  data: {
    deliveryInterfaces: [
      {
        _id: 'ch.test.delivery.pickup',
        value: 'ch.test.delivery.pickup',
        label: 'Pickup at Clerk',
        __typename: 'DeliveryInterface',
      },
      {
        _id: 'ch.test.delivery.runner',
        value: 'ch.test.delivery.runner',
        label: 'Delivery through Runner',
        __typename: 'DeliveryInterface',
      },
    ],
  },
};

export const DeliveryProviderShippingInterfaces = {
  data: {
    deliveryInterfaces: [
      {
        _id: 'ch.test.delivery.shipping',
        value: 'ch.test.delivery.shipping',
        label: 'Shipping By Postal',
        __typename: 'DeliveryInterface',
      },
      {
        _id: 'ch.test.delivery.runner',
        value: 'ch.test.delivery.runner',
        label: 'Delivery through Runner',
        __typename: 'DeliveryInterface',
      },
    ],
  },
};

export const RemoveDeliveryProviderResponse = {
  data: {
    removeDeliveryProvider: {
      _id: 'pickup',
      __typename: 'DeliveryProvider',
    },
  },
};

export const CreateDeliveryProviderResponse = {
  data: {
    createDeliveryProvider: {
      _id: '81ed9049a6a8c6cce17f3999',
      __typename: 'DeliveryProvider',
    },
  },
};

export const UpdateDeliveryProviderResponse = {
  data: {
    updateDeliveryProvider: {
      _id: 'pickup',
      created: '2022-07-08T05:59:37.885Z',
      updated: '2022-07-12T07:55:43.446Z',
      deleted: null,
      type: 'PICKUP',
      isActive: true,
      configuration: [
        {
          key: 'from',
          value: 'noreply@unchained.local',
        },
        {
          key: 'to',
          value: 'orders@unchained.local',
        },
      ],
      interface: {
        _id: 'ch.test.delivery.pickup',
        label: 'Pickup at Clerk',
        version: '1.0',
        __typename: 'DeliveryInterface',
      },
      configurationError: null,
      __typename: 'DeliveryProvider',
    },
  },
};

export const DeliveryProviderOperations = {
  GetProvidersList: 'DeliveryProviders',
  GetSingleProvider: 'DeliveryProvider',
  GetProvidersType: 'DeliveryProvidersType',
  CreateProvider: 'CreateDeliveryProvider',
  GetInterfaces: 'DeliveryInterfaces',
  RemoveProvider: 'RemoveDeliveryProvider',
  UpdateProvider: 'UpdateDeliveryProvider',
};

const DeliveryProviderMocks = {
  DeliveryProviderOperations,
  DeliveryProviderListResponse,
  SingleDeliveryProviderResponse,
  DeliveryProviderPickUpInterfaces,
  DeliveryProviderShippingInterfaces,
  DeliveryProvidersTypeResponse,
  CreateDeliveryProviderResponse,
};

export default DeliveryProviderMocks;

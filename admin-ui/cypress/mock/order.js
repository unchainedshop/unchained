export const OrderListResponse = {
  data: {
    orders: [
      {
        _id: '9fe0b596d998a414da282b47',
        status: 'FULFILLED',
        created: '2022-07-05T07:13:43.270Z',
        updated: '2022-07-05T07:53:37.432Z',
        ordered: '2022-07-05T07:14:50.211Z',
        orderNumber: '20220705-2',
        confirmed: '2022-07-05T07:48:17.664Z',
        fulfilled: '2022-07-05T07:53:37.432Z',
        contact: {
          telNumber: '+41454456656',
          emailAddress: null,
          __typename: 'Contact',
        },
        total: {
          _id: '5c97d72ff287c035127b07b562985eca8118974288fa1602ff9c9d39133ccb4d',
          isTaxable: false,
          isNetPrice: false,
          amount: 1310,
          currency: 'CHF',
          __typename: 'Price',
        },
        user: {
          _id: '3TtA3POL3aSwNDGyQ',
          username: null,
          isGuest: true,
          avatar: null,
          __typename: 'User',
        },
        __typename: 'Order',
      },
      {
        _id: 'a7d2c4b7b6b88c6920a937f8',
        status: 'REJECTED',
        created: '2022-06-30T13:32:40.526Z',
        updated: '2022-07-05T16:30:28.653Z',
        ordered: '2022-07-05T07:13:43.213Z',
        orderNumber: '20220705-1',
        confirmed: '2022-07-05T16:30:28.653Z',
        fulfilled: null,
        contact: {
          telNumber: '+41454456656',
          emailAddress: null,
          __typename: 'Contact',
        },
        total: {
          _id: 'bf19a4a294a95377e94a082c47302375d6574921a5c0869c22dca1891e7f1512',
          isTaxable: false,
          isNetPrice: false,
          amount: 1310,
          currency: 'CHF',
          __typename: 'Price',
        },
        user: {
          _id: '3TtA3POL3aSwNDGyQ',
          username: null,
          isGuest: true,
          avatar: null,
          __typename: 'User',
        },
        __typename: 'Order',
      },
      {
        _id: '5139926b7cdff1245e992c0d',
        status: 'REJECTED',
        created: '2022-06-28T06:52:48.303Z',
        updated: '2022-06-30T23:16:06.120Z',
        ordered: '2022-06-30T13:22:37.899Z',
        orderNumber: '20220630-1',
        confirmed: '2022-06-30T23:16:06.120Z',
        fulfilled: null,
        contact: {
          telNumber: '+41456456456',
          emailAddress: null,
          __typename: 'Contact',
        },
        total: {
          _id: 'a08e59112d2879deeb129839d7b86452eb1e76f4af39073461e7606f80baf9bb',
          isTaxable: false,
          isNetPrice: false,
          amount: 880,
          currency: 'CHF',
          __typename: 'Price',
        },
        user: {
          _id: 'q9N8soAZmL6tYkaOQ',
          username: null,
          isGuest: true,
          avatar: null,
          __typename: 'User',
        },
        __typename: 'Order',
      },
      {
        _id: '529e52cf97d0f345124446f0',
        status: 'REJECTED',
        created: '2022-06-27T13:52:58.038Z',
        updated: '2022-06-27T13:55:40.400Z',
        ordered: '2022-06-27T13:55:22.397Z',
        orderNumber: '20220627-6',
        confirmed: '2022-06-27T13:55:40.400Z',
        fulfilled: null,
        contact: {
          telNumber: '+41456456456',
          emailAddress: null,
          __typename: 'Contact',
        },
        total: {
          _id: 'c5246f5993c7d4c5db5a51976c93cb40a705e0cc65eaa1913fec9ca72a7f6665',
          isTaxable: false,
          isNetPrice: false,
          amount: 1045,
          currency: 'CHF',
          __typename: 'Price',
        },
        user: {
          _id: 'rTTNcxlxvScJZTmNf',
          username: null,
          isGuest: true,
          avatar: null,
          __typename: 'User',
        },
        __typename: 'Order',
      },
      {
        _id: 'open',
        status: 'REJECTED',
        created: '2022-06-27T13:49:11.293Z',
        updated: '2022-06-27T13:53:14.310Z',
        ordered: '2022-06-27T13:52:57.993Z',
        orderNumber: '20220627-5',
        confirmed: '2022-06-27T13:53:14.310Z',
        fulfilled: null,
        contact: {
          telNumber: '+41456456456',
          emailAddress: null,
          __typename: 'Contact',
        },
        total: {
          _id: '62c5b91e5d7bf669bcee20f9b7b4a1efec53a96700f36471f5dff3c3c77dbd84',
          isTaxable: false,
          isNetPrice: false,
          amount: 1310,
          currency: 'CHF',
          __typename: 'Price',
        },
        user: {
          _id: 'rTTNcxlxvScJZTmNf',
          username: null,
          isGuest: true,
          avatar: null,
          __typename: 'User',
        },
        __typename: 'Order',
      },
    ],
    ordersCount: 5,
  },
};

export const SingleOrderResponse = {
  data: {
    order: {
      _id: '9fe0b596d998a414da282b47',
      totalTax: {
        amount: 29,
        currency: 'CHF',
        __typename: 'Price',
      },
      itemsTotal: {
        amount: 1190,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalDiscount: {
        amount: 0,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalPayment: {
        amount: 116,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalDelivery: {
        amount: 0,
        currency: 'CHF',
        __typename: 'Price',
      },
      user: {
        _id: 'BKHrbTkHeGRtou5kc',
        username: 'admin',
        isGuest: false,
        avatar: {
          _id: '1ghdBZmJQvFoobiAOK1GQN-grim.jpg',
          url: 'https://orderly.xn--nd-fka.live/gridfs/user-avatars/1ghdBZmJQvFoobiAOK1GQN-grim.jpg',
          __typename: 'Media',
        },
        __typename: 'User',
      },
      discounts: [
        {
          _id: 'd46776c05ad8c799100c52a9',
          trigger: 'SYSTEM',
          code: null,
          interface: {
            _id: 'ch.orderly.discount.depot',
            label: 'Depotgebühren',
            isManualAdditionAllowed: true,
            isManualRemovalAllowed: false,
            version: '1.0',
            __typename: 'DiscountInterface',
          },
          total: {
            amount: 0,
            currency: 'CHF',
            isTaxable: false,
            isNetPrice: false,
            __typename: 'Price',
          },
          discounted: [],
          __typename: 'OrderDiscount',
        },
      ],
      payment: {
        _id: 'eb08e247383a82654ae4ef6f',
        provider: {
          _id: 'ca246b09cf48cc2ef249a549',
          type: 'GENERIC',
          interface: {
            _id: 'shop.unchained.datatrans',
            label: 'Datatrans (https://docs.datatrans.ch)',
            version: '2.0.0',
            __typename: 'PaymentInterface',
          },
          __typename: 'PaymentProvider',
        },
        status: 'OPEN',
        fee: null,
        paid: null,
        __typename: 'OrderPaymentGeneric',
      },
      delivery: {
        _id: 'e865e278aedcafb71885abc2',
        status: 'OPEN',
        provider: {
          _id: 'pickup',
          type: 'PICKUP',
          interface: {
            _id: 'ch.orderly.delivery.pickup',
            label: 'Pickup at Clerk',
            version: '1.0',
            __typename: 'DeliveryInterface',
          },
          __typename: 'DeliveryProvider',
          created: '2022-03-17T11:28:39.047Z',
          updated: null,
          deleted: null,
          configuration: [],
        },
        delivered: null,
        __typename: 'OrderDeliveryPickUp',
        fee: null,
        discounts: [],
      },
      orderNumber: '20220428-16',
      status: 'PENDING',
      created: '2022-04-28T12:05:52.504Z',
      updated: '2022-05-24T18:05:30.003Z',
      ordered: '2022-04-28T12:48:47.490Z',
      confirmed: '2022-05-24T18:05:30.003Z',
      fulfilled: null,
      contact: {
        telNumber: '+41782057916',
        emailAddress: null,
        __typename: 'Contact',
      },
      country: {
        _id: '2c134c37930db24fc9badcb2',
        isoCode: 'CH',
        flagEmoji: '🇨🇭',
        name: 'Schweiz',
        __typename: 'Country',
      },
      currency: {
        _id: 'dfe2c5c1003782e1ed4d66df',
        isoCode: 'CHF',
        isActive: true,
        __typename: 'Currency',
      },
      billingAddress: {
        firstName: null,
        lastName: null,
        company: null,
        addressLine: null,
        addressLine2: null,
        postalCode: null,
        countryCode: null,
        regionCode: null,
        city: null,
        __typename: 'Address',
      },
      total: {
        isTaxable: false,
        amount: 1306,
        currency: 'CHF',
        __typename: 'Price',
      },
      items: [
        {
          _id: '2f0a12f93cde312d027c28c6',
          product: {
            _id: 'cheeseburger',
            texts: {
              _id: 'deaa4ef7d20a8e8d0d3150d4',
              slug: 'cheeseburger',
              brand: 'Fat & Toasty',
              vendor: 'Burger Meister',
              title: 'Cheeseburger mit Pommes-Frites',
              subtitle: null,
              __typename: 'ProductTexts',
            },
            media: [
              {
                _id: '052ffb386e17bd1a1e637cdd',
                file: {
                  _id: '3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                  __typename: 'Media',
                },
                __typename: 'ProductMedia',
              },
            ],
            __typename: 'SimpleProduct',
          },
          quantity: 1,
          unitPrice: {
            amount: 1190,
            isTaxable: true,
            isNetPrice: false,
            currency: 'CHF',
            __typename: 'Price',
          },
          total: {
            amount: 1190,
            isTaxable: false,
            isNetPrice: false,
            currency: 'CHF',
            __typename: 'Price',
          },
          __typename: 'OrderItem',
        },
      ],
      __typename: 'Order',
    },
  },
};

export const SingleOrderOpenResponse = {
  data: {
    order: {
      _id: 'open',
      totalTax: {
        amount: 29,
        currency: 'CHF',
        __typename: 'Price',
      },
      itemsTotal: {
        amount: 1190,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalDiscount: {
        amount: 0,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalPayment: {
        amount: 116,
        currency: 'CHF',
        __typename: 'Price',
      },
      totalDelivery: {
        amount: 0,
        currency: 'CHF',
        __typename: 'Price',
      },
      user: {
        _id: 'BKHrbTkHeGRtou5kc',
        username: 'admin',
        isGuest: false,
        avatar: {
          _id: '1ghdBZmJQvFoobiAOK1GQN-grim.jpg',
          url: 'https://orderly.xn--nd-fka.live/gridfs/user-avatars/1ghdBZmJQvFoobiAOK1GQN-grim.jpg',
          __typename: 'Media',
        },
        __typename: 'User',
      },
      discounts: [
        {
          _id: 'd46776c05ad8c799100c52a9',
          trigger: 'SYSTEM',
          code: null,
          interface: {
            _id: 'ch.orderly.discount.depot',
            label: 'Depotgebühren',
            isManualAdditionAllowed: true,
            isManualRemovalAllowed: false,
            version: '1.0',
            __typename: 'DiscountInterface',
          },
          total: {
            amount: 0,
            currency: 'CHF',
            isTaxable: false,
            isNetPrice: false,
            __typename: 'Price',
          },
          discounted: [],
          __typename: 'OrderDiscount',
        },
      ],
      payment: {
        _id: 'eb08e247383a82654ae4ef6f',
        provider: {
          _id: 'ca246b09cf48cc2ef249a549',
          type: 'GENERIC',
          interface: {
            _id: 'shop.unchained.datatrans',
            label: 'Datatrans (https://docs.datatrans.ch)',
            version: '2.0.0',
            __typename: 'PaymentInterface',
          },
          __typename: 'PaymentProvider',
        },
        status: 'OPEN',
        fee: null,
        paid: null,
        __typename: 'OrderPaymentGeneric',
      },
      delivery: {
        _id: 'e865e278aedcafb71885abc2',
        status: 'OPEN',
        provider: {
          _id: 'pickup',
          type: 'PICKUP',
          interface: {
            _id: 'ch.orderly.delivery.pickup',
            label: 'Pickup at Clerk',
            version: '1.0',
            __typename: 'DeliveryInterface',
          },
          __typename: 'DeliveryProvider',
          created: '2022-03-17T11:28:39.047Z',
          updated: null,
          deleted: null,
          configuration: [],
        },
        delivered: null,
        __typename: 'OrderDeliveryPickUp',
        fee: null,
        discounts: [],
      },
      orderNumber: null,
      status: 'OPEN',
      created: '2022-04-28T12:05:52.504Z',
      updated: '2022-05-24T18:05:30.003Z',
      ordered: '2022-04-28T12:48:47.490Z',
      confirmed: '2022-05-24T18:05:30.003Z',
      fulfilled: null,
      contact: {
        telNumber: '+41782057916',
        emailAddress: null,
        __typename: 'Contact',
      },
      country: {
        _id: '2c134c37930db24fc9badcb2',
        isoCode: 'CH',
        flagEmoji: '🇨🇭',
        name: 'Schweiz',
        __typename: 'Country',
      },
      currency: {
        _id: 'dfe2c5c1003782e1ed4d66df',
        isoCode: 'CHF',
        isActive: true,
        __typename: 'Currency',
      },
      billingAddress: {
        firstName: null,
        lastName: null,
        company: null,
        addressLine: null,
        addressLine2: null,
        postalCode: null,
        countryCode: null,
        regionCode: null,
        city: null,
        __typename: 'Address',
      },
      total: {
        isTaxable: false,
        amount: 1306,
        currency: 'CHF',
        __typename: 'Price',
      },
      items: [
        {
          _id: '2f0a12f93cde312d027c28c6',
          product: {
            _id: 'cheeseburger',
            texts: {
              _id: 'deaa4ef7d20a8e8d0d3150d4',
              slug: 'cheeseburger',
              brand: 'Fat & Toasty',
              vendor: 'Burger Meister',
              title: 'Cheeseburger mit Pommes-Frites',
              subtitle: null,
              __typename: 'ProductTexts',
            },
            media: [
              {
                _id: '052ffb386e17bd1a1e637cdd',
                file: {
                  _id: '3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                  url: 'https://orderly.xn--nd-fka.live/gridfs/product-media/3JTrNe0Z467xHiM9Yuay2p-thumbnail_burger.jpg',
                  __typename: 'Media',
                },
                __typename: 'ProductMedia',
              },
            ],
            __typename: 'SimpleProduct',
          },
          quantity: 1,
          unitPrice: {
            amount: 1190,
            isTaxable: true,
            isNetPrice: false,
            currency: 'CHF',
            __typename: 'Price',
          },
          total: {
            amount: 1190,
            isTaxable: false,
            isNetPrice: false,
            currency: 'CHF',
            __typename: 'Price',
          },
          __typename: 'OrderItem',
        },
      ],
      __typename: 'Order',
    },
  },
};

export const OrderStatusResponse = {
  data: {
    orderStatusType: {
      options: [
        {
          value: 'OPEN',
          label: 'Open Order / Cart',
          __typename: '__EnumValue',
        },
        {
          value: 'PENDING',
          label: 'Order has been sent but confirmation awaiting',
          __typename: '__EnumValue',
        },
        {
          value: 'REJECTED',
          label: 'Order has been rejected',
          __typename: '__EnumValue',
        },
        {
          value: 'CONFIRMED',
          label: 'Order has been confirmed',
          __typename: '__EnumValue',
        },
        {
          value: 'FULFILLED',
          label:
            'Order has been fulfilled completely (all positions in delivery)',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
    },
  },
};

export const OrderPaymentStatusResponse = {
  data: {
    paymentStatusTypes: {
      options: [
        {
          value: 'OPEN',
          label: 'Unpaid Order',
          __typename: '__EnumValue',
        },
        {
          value: 'PAID',
          label: 'Order has been paid',
          __typename: '__EnumValue',
        },
        {
          value: 'REFUNDED',
          label: 'Order has been refunded',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
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

export const OrderDeliveryStatusResponse = {
  data: {
    deliveryStatusType: {
      options: [
        {
          value: 'OPEN',
          label: 'Order is not delivered',
          __typename: '__EnumValue',
        },
        {
          value: 'DELIVERED',
          label: 'Delivery complete',
          __typename: '__EnumValue',
        },
        {
          value: 'RETURNED',
          label: 'Delivery returned',
          __typename: '__EnumValue',
        },
      ],
      __typename: '__Type',
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

export const ConfirmOrderResponse = {
  data: {
    confirmOrder: {
      _id: '9fe0b596d998a414da282b47',
    },
  },
};

export const RejectOrderResponse = {
  data: {
    rejectOrder: {
      _id: '9fe0b596d998a414da282b47',
    },
  },
};

export const DeliverOrderResponse = {
  data: {
    deliverOrder: {
      _id: '9fe0b596d998a414da282b47',
    },
  },
};

export const PayOrderResponse = {
  data: {
    payOrder: {
      _id: '9fe0b596d998a414da282b47',
    },
  },
};

export const OrderOperations = {
  GetOrderList: 'Orders',
  GetSingleOrder: 'Order',
  OrderStatus: 'OrderStatus',
  OrderPaymentStatus: 'OrderPaymentStatus',
  PaymentProvidersType: 'PaymentProvidersType',
  OrderDeliveryStatus: 'OrderDeliveryStatus',
  DeliveryProvidersType: 'DeliveryProvidersType',
  ConfirmOrder: 'ConfirmOrder',
  RejectOrder: 'RejectOrder',
  DeliverOrder: 'DeliverOrder',
  PayOrder: 'PayOrder',
};

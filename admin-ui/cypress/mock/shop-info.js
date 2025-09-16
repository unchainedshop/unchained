export const ShopInfoResponse = {
  data: {
    shopInfo: {
      _id: 'test',
      version: '1.0.0',
      language: {
        _id: 'test',
        isoCode: 'de',
        name: 'de (Base)',
        __typename: 'Language',
      },
      country: {
        _id: 'test',
        isoCode: 'CH',
        flagEmoji: '🇨🇭',
        name: 'Schweiz',
        defaultCurrency: {
          _id: 'test',
          isoCode: 'CHF',
          __typename: 'Currency',
        },
        __typename: 'Country',
      },
      __typename: 'Shop',
      adminUiConfig: {
        externalLinks: [],
        customProperties: [
          {
            entityName: 'Enrollment',
            inlineFragment:
              '...on Enrollment {\n        \n        rotendoRenewalDate\n        notificationIsEnabled\n      }',
            __typename: 'AdminUiConfigCustomEntityInterface',
          },
          {
            entityName: 'ShopInfo',
            inlineFragment: '...on ShopInfo {\n        vapidPublicKey\n      }',
            __typename: 'AdminUiConfigCustomEntityInterface',
          },
        ],
        __typename: 'AdminUiConfig',
      },
    },
  },
};

const SystemRolesResponseAdmin = {
  data: {
    shopInfo: {
      _id: 'root',
      userRoles: ['admin'],
      __typename: 'Shop',
    },
  },
};

export const ShopInfoOperations = {
  ShopInfo: 'ShopInfo',
  SystemRoles: 'SystemRoles',
};

const ShopInfoMocks = {
  ShopInfoResponse,
  ShopInfoOperations,
  SystemRolesResponseAdmin,
};

export default ShopInfoMocks;

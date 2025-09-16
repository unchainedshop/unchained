export const LogInSuccessResponse = {
  data: {
    loginWithPassword: {
      id: 'BKHrbTkHeGRtou5kc',
      token: '54256db66c640f613b853ac69914288aeca5bb2460b',
      tokenExpires: '2030-01-02T06:20:16.455Z',

      user: {
        _id: 'BKHrbTkHeGRtou5kc',
        isTwoFactorEnabled: false,
        web3Addresses: [],
        webAuthnCredentials: [],
        allowedActions: [
          'answerQuotation',
          'authTwoFactor',
          'bookmarkProduct',
          'bulkImport',
          'createCart',
          'createEnrollment',
          'impersonate',
          'manageAssortments',
          'manageBookmarks',
          'manageCountries',
          'manageCurrencies',
          'manageDeliveryProviders',
          'manageFilters',
          'manageLanguages',
          'managePaymentCredentials',
          'managePaymentProviders',
          'manageProductReviews',
          'manageProducts',
          'manageQuotations',
          'manageTwoFactor',
          'manageUsers',
          'manageWarehousingProviders',
          'manageWorker',
          'markOrderConfirmed',
          'markOrderDelivered',
          'markOrderPaid',
          'markOrderRejected',
          'registerPaymentCredentials',
          'requestQuotation',
          'reviewProduct',
          'search',
          'sendEmail',
          'updateCart',
          'updateEnrollment',
          'updateOrder',
          'updateOrderDelivery',
          'updateOrderDiscount',
          'updateOrderItem',
          'updateOrderPayment',
          'updateProductReview',
          'updateUser',
          'updateUsername',
          'viewAssortment',
          'viewAssortments',
          'viewCountries',
          'viewCountry',
          'viewCurrencies',
          'viewCurrency',
          'viewDeliveryInterfaces',
          'viewDeliveryProvider',
          'viewDeliveryProviders',
          'viewEnrollment',
          'viewEnrollments',
          'viewEvent',
          'viewEvents',
          'viewFilter',
          'viewFilters',
          'viewLanguage',
          'viewLanguages',
          'viewLogs',
          'viewOrder',
          'viewOrders',
          'viewPaymentInterfaces',
          'viewPaymentProvider',
          'viewPaymentProviders',
          'viewProduct',
          'viewProducts',
          'viewQuotation',
          'viewQuotations',
          'viewShopInfo',
          'viewTranslations',
          'viewUser',
          'viewUserEnrollments',
          'viewUserOrders',
          'viewUserPrivateInfos',
          'viewUserPublicInfos',
          'viewUserQuotations',
          'viewUserRoles',
          'viewUsers',
          'viewWarehousingInterfaces',
          'viewWarehousingProvider',
          'viewWarehousingProviders',
          'voteProductReview',
        ],
        roles: ['admin'],
        __typename: 'User',
      },
      __typename: 'LoginMethodResponse',
    },
  },
};

export const InvalidCredentialErrorResponse = {
  errors: [
    {
      message: 'Invalid credentials',
      path: ['loginWithPassword'],
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  ],
  data: {
    loginWithPassword: null,
  },
  extensions: {
    tracing: {
      version: 1,
      startTime: '2022-07-06T06:22:48.417Z',
      endTime: '2030-07-06T06:22:48.417Z',
      duration: 92345962,
      execution: {
        resolvers: [
          {
            path: ['loginWithPassword'],
            parentType: 'Mutation',
            fieldName: 'loginWithPassword',
            returnType: 'LoginMethodResponse',
            startOffset: 547604,
            duration: 90986071,
          },
        ],
      },
    },
  },
};

export const ForgotPasswordFailedResponse = {
  data: {
    forgotPassword: {
      success: false,
      __typename: 'SuccessResponse',
    },
  },
};

export const ForgotPasswordSuccessResponse = {
  data: {
    forgotPassword: {
      success: true,
      __typename: 'SuccessResponse',
    },
  },
};

export const AuthenticationOperations = {
  LoginWithPassword: 'LoginWithPassword',
  ForgotPassword: 'ForgotPassword',
  CreateUser: 'CreateUser',
  CreateWebAuthnCredentialRequestOptions:
    'CreateWebAuthnCredentialRequestOptions',
  UserWebAuthnCredentials: 'UserWebAuthnCredentials',
};

export const EmailExistsEnrollmentErrorResponse = {
  errors: [
    {
      message: 'Email already exists',
      path: ['createUser'],
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  ],
  data: {
    createUser: null,
  },
};

export const EnrollmentSuccessResponse = {
  data: {
    createUser: {
      id: 'M2ppf7NolNW858CUv',
      token: '2e804e2ceb0a98fc914acb21dffb37802258b432ae9',
      tokenExpires: '2030-01-15T19:09:54.700Z',
      __typename: 'LoginMethodResponse',
    },
  },
};

export const CreateWebAuthnCredentialRequestOptionsResponse = {
  data: {
    createWebAuthnCredentialRequestOptions: {
      challenge:
        'cNnRQn1wT3m/MzyzCSg2C83dEf23+emjlLCtVPnBY9IM8ZkFpgxqBrYR3iftISfDGpfo/nH4TiT3WaxLK1tiAQ==',
      timeout: 60000,
      rpId: 'localhost',
      requestId: 1665406065454,
    },
  },
};

export const UserWebAuthnCredentialsResponse = {
  data: {
    user: {
      _id: 'zmCNUUHJJYZRMFHdN',
      webAuthnCredentials: [],
      __typename: 'User',
    },
  },
};

const Authorization = {
  LogInSuccessResponse,
  InvalidCredentialErrorResponse,
  ForgotPasswordFailedResponse,
  ForgotPasswordSuccessResponse,
  EmailExistsEnrollmentErrorResponse,
  EnrollmentSuccessResponse,
  UserWebAuthnCredentialsResponse,
};

export default Authorization;

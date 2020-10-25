import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users';
import {
  SimplePaymentProvider,
  SimplePaymenttCredential,
} from './seeds/payments';

let connection;
let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('PaymentProviders', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetchAsAdminUser = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Query.paymentProviders when loged in should', () => {
    it('return array of all paymentProvider when type is not given', async () => {
      const {
        data: { paymentProviders },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProviders {
            paymentProviders {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {},
      });
      expect(paymentProviders.length).toEqual(3);
    });

    it('return list of paymentProvider of the given type', async () => {
      const {
        data: { paymentProviders },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProviders($type: PaymentProviderType) {
            paymentProviders(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: 'INVOICE',
        },
      });
      expect(paymentProviders.length).toEqual(2);
    });
  });

  describe('Query.paymentProvider when loged in should', () => {
    it('return single paymentProvider when ID is provided', async () => {
      const {
        data: { paymentProvider },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProvider($paymentProviderId: ID!) {
            paymentProvider(paymentProviderId: $paymentProviderId) {
              _id
              created
              updated
              deleted
              type
              interface {
                _id
                label
                version
              }
              configuration
              configurationError
            }
          }
        `,
        variables: {
          paymentProviderId: SimplePaymentProvider._id,
        },
      });
      expect(paymentProvider._id).toEqual(SimplePaymentProvider._id);
    });

    it('return not found error when passed non-existing paymentProviderId', async () => {
      const {
        data: { paymentProvider },
        errors,
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProvider($paymentProviderId: ID!) {
            paymentProvider(paymentProviderId: $paymentProviderId) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: 'non-existing-id',
        },
      });
      expect(paymentProvider).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual(
        'PaymentProviderNotFoundError',
      );
    });

    it('return error when passed invalid paymentProviderId', async () => {
      const {
        data: { paymentProvider },
        errors,
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProvider($paymentProviderId: ID!) {
            paymentProvider(paymentProviderId: $paymentProviderId) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: '',
        },
      });
      expect(paymentProvider).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Query.paymentProviders for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query PaymentProviders {
            paymentProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe('Mutation.removePaymentCredentials for admin user should', () => {
    it('mark pament provider specified by ID as invalid', async () => {
      const {
        data: { removePaymentCredentials } = {},
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(
              paymentCredentialsId: $paymentCredentialsId
            ) {
              _id
              meta
              token
              isValid
              isPreferred
              paymentProvider {
                _id
              }
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymenttCredential._id,
        },
      });
      expect(removePaymentCredentials).toMatchObject({
        _id: SimplePaymenttCredential._id,
        isValid: false,
        isPreferred: true,
      });
    });

    it('return PaymentCredentialNotFoundError when passed non existing payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(
              paymentCredentialsId: $paymentCredentialsId
            ) {
              _id
              meta
              token
              isValid
              isPreferred
              paymentProvider {
                _id
              }
            }
          }
        `,
        variables: {
          paymentCredentialsId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual(
        'PaymentCredentialsNotFoundError',
      );
    });

    it('return InvalidIdError when passed invalid payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(
              paymentCredentialsId: $paymentCredentialsId
            ) {
              _id
              meta
              token
              isValid
              isPreferred
              paymentProvider {
                _id
              }
            }
          }
        `,
        variables: {
          paymentCredentialsId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.removePaymentCredentials for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(
              paymentCredentialsId: $paymentCredentialsId
            ) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymenttCredential._id,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.removePaymentCredentials for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(
              paymentCredentialsId: $paymentCredentialsId
            ) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymenttCredential._id,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});

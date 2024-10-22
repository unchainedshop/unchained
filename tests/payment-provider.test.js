import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import {
  GenericPaymentCredential,
  PrePaidPaymentCredential,
  SimplePaymentProvider,
  SimplePaymentCredential,
} from './seeds/payments.js';

let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('PaymentProviders', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdminUser = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('Query.paymentProvidersCount when logged in should', () => {
    it('return total number of 3 paymentProvider when type is not given', async () => {
      const {
        data: { paymentProvidersCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query {
            paymentProvidersCount
          }
        `,
        variables: {},
      });
      expect(paymentProvidersCount).toEqual(3);
    });

    it('return total number of 2 paymentProvider of the given type', async () => {
      const {
        data: { paymentProvidersCount },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query PaymentProvidersCount($type: PaymentProviderType) {
            paymentProvidersCount(type: $type)
          }
        `,
        variables: {
          type: 'INVOICE',
        },
      });
      expect(paymentProvidersCount).toEqual(2);
    });
  });

  describe('Query.paymentProviders when logged in should', () => {
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

  describe('Query.paymentProvider when logged in should', () => {
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
      expect(paymentProvider).toMatchObject({
        _id: SimplePaymentProvider._id,
        type: SimplePaymentProvider.type,
        configurationError: null,
      });
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
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query PaymentProviders {
            paymentProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.paymentProvidersCount for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query PaymentProviders {
            paymentProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.removePaymentCredentials for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymentCredential._id,
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
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymentCredential._id,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.removePaymentCredentials for admin user should', () => {
    it('mark payment provider specified by ID as invalid', async () => {
      const { data: { removePaymentCredentials } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
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
          paymentCredentialsId: SimplePaymentCredential._id,
        },
      });

      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: SimplePaymentCredential._id,
        },
      });
      expect(removePaymentCredentials._id).not.toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('PaymentCredentialsNotFoundError');
    });

    it('return PaymentCredentialNotFoundError when passed non existing payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('PaymentCredentialsNotFoundError');
    });

    it('return InvalidIdError when passed invalid payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation removePaymentCredentials($paymentCredentialsId: ID!) {
            removePaymentCredentials(paymentCredentialsId: $paymentCredentialsId) {
              _id
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

  describe('Mutation.markPaymentCredentialsPreferred for admin user should', () => {
    it('mark payment credential specified by ID as preferred', async () => {
      const { data: { markPaymentCredentialsPreferred } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
              token
              isValid
              paymentProvider {
                _id
              }
              isPreferred
            }
          }
        `,
        variables: {
          paymentCredentialsId: PrePaidPaymentCredential._id,
        },
      });
      expect(markPaymentCredentialsPreferred).toMatchObject({
        _id: PrePaidPaymentCredential._id,
        isPreferred: true,
      });
    });

    it('return PaymentCredentialNotFoundError when passed non existing payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('PaymentCredentialsNotFoundError');
    });

    it('not throw NoPermissionError when attempting to update other users payment credential', async () => {
      const { errors = [] } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
              isPreferred
            }
          }
        `,
        variables: {
          paymentCredentialsId: GenericPaymentCredential._id,
        },
      });
      expect(errors.length).toBe(0);
    });

    it('return InvalidIdError when passed invalid payment credential ID', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
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

  describe('Mutation.markPaymentCredentialsPreferred for normal user should', () => {
    it('mark payment credential specified by ID as preferred', async () => {
      const { data: { markPaymentCredentialsPreferred } = {} } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
              isPreferred
            }
          }
        `,
        variables: {
          paymentCredentialsId: GenericPaymentCredential._id,
        },
      });

      expect(markPaymentCredentialsPreferred).toMatchObject({
        _id: GenericPaymentCredential._id,
        isPreferred: true,
      });
    });

    it('return NoPermissionError when attempting to update other users payment credential', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
              isPreferred
            }
          }
        `,
        variables: {
          paymentCredentialsId: PrePaidPaymentCredential._id,
        },
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Mutation.markPaymentCredentialsPreferred for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation markPaymentCredentialsPreferred($paymentCredentialsId: ID!) {
            markPaymentCredentialsPreferred(paymentCredentialsId: $paymentCredentialsId) {
              _id
            }
          }
        `,
        variables: {
          paymentCredentialsId: GenericPaymentCredential._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
});

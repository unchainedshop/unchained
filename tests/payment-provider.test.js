import test from 'node:test';
import assert from 'node:assert';
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

test.before(async () => {
  await setupDatabase();
  graphqlFetchAsAdminUser = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
  graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
});

test('return total number of 3 paymentProvider when type is not given', async () => {
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
  assert.strictEqual(paymentProvidersCount, 3);
});

test('return total number of 2 paymentProvider of the given type', async () => {
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
  assert.strictEqual(paymentProvidersCount, 2);
});

test('return array of all paymentProvider when type is not given', async () => {
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
  assert.strictEqual(paymentProviders.length, 3);
});

test('return list of paymentProvider of the given type', async () => {
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
  assert.strictEqual(paymentProviders.length, 2);
});

test('return single paymentProvider when ID is provided', async () => {
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
  assert.deepStrictEqual(paymentProvider, {
    _id: SimplePaymentProvider._id,
    type: SimplePaymentProvider.type,
    configurationError: null,
  });
});

test('return error when passed invalid paymentProviderId', async () => {
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
  assert.strictEqual(paymentProvider, null);
  assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
});

test('return error for anonymous user', async () => {
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
  assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
});

test('return NoPermissionError for anonymous user', async () => {
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
  assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
});

test('return NoPermissionError for normal user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
});

test('return NoPermissionError for anonymous user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
});

test('mark payment provider specified by ID as invalid for admin user', async () => {
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
  assert.notStrictEqual(removePaymentCredentials._id, null);
  assert.strictEqual(errors[0]?.extensions?.code, 'PaymentCredentialsNotFoundError');
});

test('return PaymentCredentialNotFoundError when passed non existing payment credential ID for admin user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'PaymentCredentialsNotFoundError');
});

test('return InvalidIdError when passed invalid payment credential ID for admin user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
});

test('mark payment credential specified by ID as preferred for admin user', async () => {
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
  assert.deepStrictEqual(markPaymentCredentialsPreferred, {
    _id: PrePaidPaymentCredential._id,
    isPreferred: true,
  });
});

test('return PaymentCredentialNotFoundError when passed non existing payment credential ID for admin user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'PaymentCredentialsNotFoundError');
});

test('not throw NoPermissionError when attempting to update other users payment credential for admin user', async () => {
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
  assert.strictEqual(errors.length, 0);
});

test('return InvalidIdError when passed invalid payment credential ID for admin user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
});

test('mark payment credential specified by ID as preferred for normal user', async () => {
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
  assert.deepStrictEqual(markPaymentCredentialsPreferred, {
    _id: GenericPaymentCredential._id,
    isPreferred: true,
  });
});

test('return NoPermissionError when attempting to update other users payment credential for normal user', async () => {
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
  assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
});

test('return NoPermissionError for anonymous user', async () => {
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
  assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
});

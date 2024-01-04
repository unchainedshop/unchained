import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { PrePaidPaymentProvider } from './seeds/payments.js';
import { SimpleOrder, SimplePayment, GenericPayment } from './seeds/orders.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Order: Payments', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('Mutation.setOrderPaymentProvider for admin user', () => {
    it('set order payment provider', async () => {
      const { data: { setOrderPaymentProvider } = {} } =
        await graphqlFetchAsAdmin({
          query: /* GraphQL */ `
            mutation setOrderPaymentProvider(
              $orderId: ID!
              $paymentProviderId: ID!
            ) {
              setOrderPaymentProvider(
                orderId: $orderId
                paymentProviderId: $paymentProviderId
              ) {
                _id
                status
                payment {
                  _id
                  provider {
                    _id
                  }
                  fee {
                    _id
                    amount
                  }
                }
              }
            }
          `,
          variables: {
            orderId: SimpleOrder._id,
            paymentProviderId: PrePaidPaymentProvider._id,
          },
        });
      expect(setOrderPaymentProvider).toMatchObject({
        _id: SimpleOrder._id,
        payment: {
          provider: {
            _id: PrePaidPaymentProvider._id,
          },
        },
      });
    });

    it('returns not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderPaymentProvider(
            $orderId: ID!
            $paymentProviderId: ID!
          ) {
            setOrderPaymentProvider(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
          paymentProviderId: PrePaidPaymentProvider._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('returns error when passed invalid paymentProviderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderPaymentProvider(
            $orderId: ID!
            $paymentProviderId: ID!
          ) {
            setOrderPaymentProvider(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          paymentProviderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('returns error when passed invalid orderId', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation setOrderPaymentProvider(
            $orderId: ID!
            $paymentProviderId: ID!
          ) {
            setOrderPaymentProvider(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: '',
          paymentProviderId: PrePaidPaymentProvider._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.setOrderPaymentProvider for logged in user should', () => {
    it('set order payment provider successfuly', async () => {
      const { data: { setOrderPaymentProvider } = {} } =
        await graphqlFetchAsNormalUser({
          query: /* GraphQL */ `
            mutation setOrderPaymentProvider(
              $orderId: ID!
              $paymentProviderId: ID!
            ) {
              setOrderPaymentProvider(
                orderId: $orderId
                paymentProviderId: $paymentProviderId
              ) {
                _id
                payment {
                  _id
                  provider {
                    _id
                  }
                }
              }
            }
          `,
          variables: {
            orderId: SimpleOrder._id,
            paymentProviderId: PrePaidPaymentProvider._id,
          },
        });
      expect(setOrderPaymentProvider).toMatchObject({
        _id: SimpleOrder._id,
        payment: {
          provider: { _id: PrePaidPaymentProvider._id },
        }
      });
    });
  });

  describe('Mutation.setOrderPaymentProvider for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation setOrderPaymentProvider(
            $orderId: ID!
            $paymentProviderId: ID!
          ) {
            setOrderPaymentProvider(
              orderId: $orderId
              paymentProviderId: $paymentProviderId
            ) {
              _id
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
          paymentProviderId: PrePaidPaymentProvider._id,
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('Mutation.updateOrderPaymentInvoice for admin user should', () => {
    it('update order payment (invoice & card)', async () => {
      const { data: { updateOrderPaymentInvoice } = {} } =
        await graphqlFetchAsAdmin({
          query: /* GraphQL */ `
            mutation updateOrderPaymentInvoice(
              $orderPaymentId: ID!
              $meta: JSON
            ) {
              updateOrderPaymentInvoice(
                orderPaymentId: $orderPaymentId
                meta: $meta
              ) {
                _id
                provider {
                  _id
                  type
                }
              }
            }
          `,
          variables: {
            orderPaymentId: SimplePayment._id,
            meta: {
              john: 'wayne',
            },
          },
        });

      expect(updateOrderPaymentInvoice).toMatchObject({
        _id: SimplePayment._id,
        provider: {
          type: 'INVOICE',
        },
      });
    });

    it('return not found error when passed non existing order payment ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderPaymentInvoice(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentInvoice(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderPaymentId: 'non-existing-id',
          meta: {
            john: 'wayne',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'OrderPaymentNotFoundError',
      });
    });

    it('return invalid ID error when passed invalid order payment ID', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderPaymentInvoice(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentInvoice(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderPaymentId: '',
          meta: {
            john: 'wayne',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'InvalidIdError',
      });
    });

    it('return error when order payment provider type is not INVOICE', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderPaymentInvoice(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentInvoice(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderPaymentId: GenericPayment._id,
          meta: {
            john: 'wayne',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        orderPaymentId: GenericPayment._id,
        code: 'OrderPaymentTypeError',
        received: 'GENERIC',
        required: 'INVOICE',
      });
    });
  });

  describe('Mutation.updateOrderPaymentInvoice for logged in user should', () => {
    it('update order payment (invoice & card)', async () => {
      const { data: { updateOrderPaymentInvoice } = {} } =
        await graphqlFetchAsNormalUser({
          query: /* GraphQL */ `
            mutation updateOrderPaymentInvoice(
              $orderPaymentId: ID!
              $meta: JSON
            ) {
              updateOrderPaymentInvoice(
                orderPaymentId: $orderPaymentId
                meta: $meta
              ) {
                _id
                provider {
                  _id
                  type
                }
              }
            }
          `,
          variables: {
            orderPaymentId: SimplePayment._id,
            meta: {
              john: 'wayne',
            },
          },
        });

      expect(updateOrderPaymentInvoice).toMatchObject({
        _id: SimplePayment._id,
        provider: {
          type: 'INVOICE',
        },
      });
    });
  });

  describe('Mutation.updateOrderPaymentInvoice for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateOrderPaymentInvoice(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentInvoice(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
              provider {
                _id
                type
              }
            }
          }
        `,
        variables: {
          orderPaymentId: SimplePayment._id,
          meta: {
            john: 'wayne',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('Mutation.updateOrderPaymentGeneric for admin user should', () => {
    it('update order payment successfuly when order payment provider type is generic', async () => {
      const { data: { updateOrderPaymentGeneric } = {} } =
        await graphqlFetchAsAdmin({
          query: /* GraphQL */ `
            mutation updateOrderPaymentGeneric(
              $orderPaymentId: ID!
              $meta: JSON
            ) {
              updateOrderPaymentGeneric(
                orderPaymentId: $orderPaymentId
                meta: $meta
              ) {
                _id
                provider {
                  _id
                  type
                }
              }
            }
          `,
          variables: {
            orderPaymentId: GenericPayment._id,
            meta: {
              john: 'wayne',
            },
          },
        });
      expect(updateOrderPaymentGeneric).toMatchObject({
        _id: GenericPayment._id,
        provider: {
          type: 'GENERIC',
        },
      });
    });

    it('return error when order payment type is not GENERIC', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation updateOrderPaymentGeneric(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentGeneric(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderPaymentId: SimplePayment._id,
          meta: {
            john: 'wayne',
          },
        },
      });
      expect(errors?.[0]?.extensions).toMatchObject({
        orderPaymentId: SimplePayment._id,
        code: 'OrderPaymentTypeError',
        received: 'INVOICE',
        required: 'GENERIC',
      });
    });
  });

  describe('Mutation.updateOrderPaymentGeneric for logged in user should', () => {
    it('update order payment successfuly when order payment provider type is generic', async () => {
      const { data: { updateOrderPaymentGeneric } = {} } =
        await graphqlFetchAsNormalUser({
          query: /* GraphQL */ `
            mutation updateOrderPaymentGeneric(
              $orderPaymentId: ID!
              $meta: JSON
            ) {
              updateOrderPaymentGeneric(
                orderPaymentId: $orderPaymentId
                meta: $meta
              ) {
                _id
              }
            }
          `,
          variables: {
            orderPaymentId: GenericPayment._id,
            meta: {
              john: 'wayne',
            },
          },
        });
      expect(updateOrderPaymentGeneric).toMatchObject({
        _id: GenericPayment._id,
      });
    });
  });

  describe('Mutation.updateOrderPaymentGeneric for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          mutation updateOrderPaymentGeneric(
            $orderPaymentId: ID!
            $meta: JSON
          ) {
            updateOrderPaymentGeneric(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
            }
          }
        `,
        variables: {
          orderPaymentId: GenericPayment._id,
          meta: {
            john: 'wayne',
          },
        },
      });

      expect(errors?.[0]?.extensions).toMatchObject({
        code: 'NoPermissionError',
      });
    });
  });

  describe('Mutation.updateOrderPaymentCard', () => {
    it.todo(
      'All test senarios tests for the other endpoints above including role based', // Currently no payment provider with type CARD implemented
    );
  });
});

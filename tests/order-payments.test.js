import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { PrePaidPaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePayment, GenericPayment } from './seeds/orders';

let connection;
let graphqlFetch;

describe('Order: Payments', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.setOrderPaymentProvider', () => {
    it('set order payment provider', async () => {
      const { data: { setOrderPaymentProvider } = {} } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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
      const { errors } = await graphqlFetch({
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

  describe('Mutation.updateOrderPaymentInvoice / Mutation.updateOrderPaymentCard', () => {
    it('update order payment (invoice & card)', async () => {
      const { data: { updateOrderPaymentInvoice } = {} } = await graphqlFetch({
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
              meta
              provider {
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
      console.log(updateOrderPaymentInvoice);
      expect(updateOrderPaymentInvoice).toMatchObject({
        _id: SimplePayment._id,
        meta: {
          john: 'wayne',
        },
      });
    });
  });

  //
  describe('Mutation.updateOrderPaymentGeneric', () => {
    it('update order payment (generic)', async () => {
      const { data: { updateOrderPaymentGeneric } = {} } = await graphqlFetch({
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
              meta
              sign
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
        meta: {
          john: 'wayne',
        },
        sign:
          '0bea13199c5abb6d0861d661d565a47f193bc20dc10bad12f00e584a33f01939',
      });
    });
  });

  describe('Mutation.updateOrderPayment', () => {
    it.todo('all senario tests');
  });
});

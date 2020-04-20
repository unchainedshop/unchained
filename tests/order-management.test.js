import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleOrder, ConfirmedOrder, PendingOrder } from './seeds/orders';

let connection;
// eslint-disable-next-line no-unused-vars
let db;
let graphqlFetch;

describe('Order: Management', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.removeOrder', () => {
    it('cannot remove an already submitted order', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeOrder($orderId: ID!) {
            removeOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });
      expect(errors.length).toEqual(1);
    });

    it('remove a cart', async () => {
      const { data: { removeOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeOrder($orderId: ID!) {
            removeOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
        },
      });
      expect(removeOrder).toMatchObject({
        _id: SimpleOrder._id,
      });
    });
  });

  describe('Mutation.confirmOrder', () => {
    it('cannot confirm an already confirmed order', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmOrder($orderId: ID!) {
            confirmOrder(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });
      expect(errors.length).toEqual(1);
    });

    it('confirm a pending order', async () => {
      const { data: { confirmOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmOrder($orderId: ID!) {
            confirmOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: PendingOrder._id,
        },
      });
      expect(confirmOrder).toMatchObject({
        _id: PendingOrder._id,
        status: 'CONFIRMED',
      });
    });
  });

  describe('Mutation.payOrder / deliverOrder', () => {
    it('pay a confirmed order', async () => {
      const { data: { payOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation payOrder($orderId: ID!) {
            payOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });
      expect(payOrder).toMatchObject({
        _id: ConfirmedOrder._id,
        status: 'CONFIRMED',
      });
    });

    it('deliver a confirmed order -> leads to fullfilled', async () => {
      const { data: { deliverOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation deliverOrder($orderId: ID!) {
            deliverOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });
      expect(deliverOrder).toMatchObject({
        _id: ConfirmedOrder._id,
        status: 'FULLFILLED',
      });
    });
  });
});

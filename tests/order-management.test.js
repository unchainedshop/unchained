import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleOrder, ConfirmedOrder, PendingOrder } from './seeds/orders.js';

let graphqlFetch;

describe('Order: Management', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
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
      expect(errors[0].extensions?.code).toEqual('OrderWrongStatusError');
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
        status: 'OPEN',
      });
    });

    it('return not found error when passed non existing orderId', async () => {
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
          orderId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('return error when passed invalid orderId', async () => {
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
          orderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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
      expect(errors[0]?.extensions?.code).toEqual('OrderWrongStatusError');
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

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmOrder($orderId: ID!) {
            confirmOrder(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation confirmOrder($orderId: ID!) {
            confirmOrder(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.rejectOrder', () => {
    beforeAll(async () => {
      await setupDatabase();
    });

    it('cannot reject an already confirmed order', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation rejectOrder($orderId: ID!) {
            rejectOrder(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderWrongStatusError');
    });

    it('reject a pending order', async () => {
      const { data: { rejectOrder } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation rejectOrder($orderId: ID!) {
            rejectOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: PendingOrder._id,
        },
      });
      expect(rejectOrder).toMatchObject({
        _id: PendingOrder._id,
        status: 'REJECTED',
      });
    });

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation rejectOrder($orderId: ID!) {
            rejectOrder(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });
  });

  describe('Mutation.payOrder', () => {
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

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation payOrder($orderId: ID!) {
            payOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: 'invalid-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('return error when passed invalid orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation payOrder($orderId: ID!) {
            payOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: '',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.deliverOrder', () => {
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

    it('return not found error when passed non existing orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation deliverOrder($orderId: ID!) {
            deliverOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
    });

    it('return error when passed invalid orderId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation deliverOrder($orderId: ID!) {
            deliverOrder(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});

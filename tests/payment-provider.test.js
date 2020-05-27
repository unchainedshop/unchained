import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimplePaymentProvider } from "./seeds/payments";

let connection;
let graphqlFetch;

describe("PaymentProviders", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe("Query.paymentProviders when loged in should", () => {
    it("return array of all paymentProvider when type is not given", async () => {
      const {
        data: { paymentProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query PaymentProviders {
            paymentProviders {
              _id
            }
          }
        `,
        variables: {},
      });
      expect(paymentProviders.length).toEqual(3);
    });

    it("return list of paymentProvider of the given type", async () => {
      const {
        data: { paymentProviders },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query PaymentProviders($type: PaymentProviderType) {
            paymentProviders(type: $type) {
              _id
            }
          }
        `,
        variables: {
          type: "INVOICE",
        },
      });
      expect(paymentProviders.length).toEqual(2);
    });
  });

  describe("Query.paymentProvider when loged in should", () => {
    it("return single paymentProvider when ID is provided", async () => {
      const {
        data: { paymentProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query PaymentProvider($paymentProviderId: ID!) {
            paymentProvider(paymentProviderId: $paymentProviderId) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: SimplePaymentProvider._id,
        },
      });
      expect(paymentProvider._id).toEqual(SimplePaymentProvider._id);
    });

    it("return null when non-existing paymentProviderId is given", async () => {
      const {
        data: { paymentProvider },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query PaymentProvider($paymentProviderId: ID!) {
            paymentProvider(paymentProviderId: $paymentProviderId) {
              _id
            }
          }
        `,
        variables: {
          paymentProviderId: "non-existing-id",
        },
      });
      expect(paymentProvider).toBe(null);
    });
  });

  describe("Query.paymentProviders for anonymous user should", () => {
    it("return error", async () => {
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
});

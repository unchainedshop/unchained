import { createLoggedInGraphqlFetch, setupDatabase } from "./helpers.js";
import { SimpleProduct } from "./seeds/products.js";

let db;
let graphqlFetch;
let orderId;

describe("Cart Checkout Flow", () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  describe("Mutation.createCart", () => {
    it("create a cart with a specific order number", async () => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "wishlist") {
              _id
              orderNumber
            }
          }
        `,
      });
      expect(createCart).toMatchObject({
        orderNumber: "wishlist",
      });

      orderId = createCart._id;
    });
  });

  describe("Mutation.addCartProduct", () => {
    it("add a product to the cart", async () => {
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct(
            $productId: ID!
            $quantity: Int
            $orderId: ID
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              orderId: $orderId
            ) {
              _id
              quantity
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          orderId,
          quantity: 1,
        },
      });
      expect(addCartProduct).toMatchObject({
        quantity: 1,
      });
    });
  });

  describe("Mutation.updateCart", () => {
    it("update the billingAddress", async () => {
      const { data: { updateCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart($billingAddress: AddressInput, $orderId: ID) {
            updateCart(orderId: $orderId, billingAddress: $billingAddress) {
              _id
              billingAddress {
                firstName
                lastName
                postalCode
                city
              }
            }
          }
        `,
        variables: {
          orderId,
          billingAddress: {
            firstName: "Hallo",
            lastName: "Velo",
            addressLine: "Strasse 1",
            addressLine2: "Postfach",
            postalCode: "8000",
            city: "Zürich",
          },
        },
      });

      expect(updateCart).toMatchObject({
        billingAddress: {
          firstName: "Hallo",
          lastName: "Velo",
          postalCode: "8000",
          city: "Zürich",
        },
      });
    });

    it("update the contact", async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart(
            $meta: JSON
            $contact: ContactInput
            $orderId: ID
          ) {
            updateCart(orderId: $orderId, contact: $contact, meta: $meta) {
              _id
              contact {
                emailAddress
                telNumber
              }
            }
          }
        `,
        variables: {
          orderId,
          contact: {
            emailAddress: "hello@unchained.local",
            telNumber: "+41999999999",
          },
          meta: {
            hi: "there",
          },
        },
      });

      expect(data?.updateCart).toMatchObject({
        contact: {
          emailAddress: "hello@unchained.local",
          telNumber: "+41999999999",
        },
      });
    });
  });

  describe("Mutation.checkoutCart", () => {
    it("checkout the cart with invoice", async () => {
      const { data: { checkoutCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkoutCart($orderId: ID) {
            checkoutCart(orderId: $orderId) {
              _id
              orderNumber
              status
            }
          }
        `,
        variables: {
          orderId,
        },
      });

      expect(checkoutCart).toMatchObject({
        orderNumber: "wishlist",
        status: "CONFIRMED",
      });
    });

    it("return error if trying to checkout the cart with invoice again", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkoutCart($orderId: ID) {
            checkoutCart(orderId: $orderId) {
              _id
              orderNumber
              status
            }
          }
        `,
        variables: {
          orderId,
        },
      });

      expect(errors[0].extensions.code).toEqual("OrderWrongStatusError");
    });
  });
});

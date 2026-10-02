import { gql } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { EVENT_START_SORT_KEY } from '../utils/dates.ts';
import { buildBoxOfficeItems, findBoxOfficeProvider } from '../utils/box-office.ts';

// DateTime arguments are served as the DateTimeISO scalar, so the variables are declared as such.
const BoxOfficeEventsQuery = gql`
  query BoxOfficeEvents($slotFrom: DateTimeISO, $sort: [SortOptionInput!], $limit: Int) {
    ticketEvents(limit: $limit, includeDrafts: false, slotFrom: $slotFrom, sort: $sort) {
      _id
      status
      ... on TokenizedProduct {
        texts {
          _id
          title
          subtitle
        }
        event {
          startsAt
          location
          category
          categoryTitle
          isCanceled
          saleRules {
            onSale
            salesEnd
            maxPerOrder
          }
        }
        simulatedPrice {
          amount
          currencyCode
        }
        simulatedStocks {
          quantity
        }
      }
    }
  }
`;

const BoxOfficeCartQuery = gql`
  query BoxOfficeCart {
    me {
      _id
      cart {
        _id
        items {
          _id
        }
      }
    }
  }
`;

const EmptyBoxOfficeCartMutation = gql`
  mutation EmptyBoxOfficeCart($orderId: ID) {
    emptyCart(orderId: $orderId) {
      _id
    }
  }
`;

const AddBoxOfficeItemsMutation = gql`
  mutation AddBoxOfficeItems($orderId: ID, $items: [OrderItemInput!]!) {
    addMultipleCartProducts(orderId: $orderId, items: $items) {
      _id
      supportedPaymentProviders {
        _id
        interface {
          _id
        }
      }
    }
  }
`;

const UpdateBoxOfficeCartMutation = gql`
  mutation UpdateBoxOfficeCart(
    $orderId: ID
    $contact: ContactInput
    $billingAddress: AddressInput
    $paymentProviderId: ID
  ) {
    updateCart(
      orderId: $orderId
      contact: $contact
      billingAddress: $billingAddress
      paymentProviderId: $paymentProviderId
    ) {
      _id
    }
  }
`;

const CheckoutBoxOfficeCartMutation = gql`
  mutation CheckoutBoxOfficeCart($orderId: ID) {
    checkoutCart(orderId: $orderId) {
      _id
      orderNumber
      status
      ticketsPdfUrl
      total {
        amount
        currencyCode
      }
      items {
        _id
        quantity
        product {
          _id
          ... on TokenizedProduct {
            texts {
              _id
              title
            }
            event {
              startsAt
              categoryTitle
            }
          }
        }
        tokens {
          _id
          tokenSerialNumber
          attendeeName
          ticketStatus
        }
      }
    }
  }
`;

const EVENT_START_ASC = [
  { key: EVENT_START_SORT_KEY, value: 'ASC' },
  { key: '_id', value: 'ASC' },
];

/** Active ticket events starting from today on, soonest first, with price and remaining tickets. */
export const useBoxOfficeEvents = ({ slotFrom }: { slotFrom: string }) => {
  const { data, loading, error, refetch } = useQuery<any>(BoxOfficeEventsQuery, {
    variables: { slotFrom, sort: EVENT_START_ASC, limit: 100 },
    fetchPolicy: 'cache-and-network',
  });
  return { events: (data?.ticketEvents || []) as any[], loading, error, refetch };
};

export interface BoxOfficeSale {
  quantities: Record<string, number>;
  attendees?: Record<string, string[]>;
  contact?: { emailAddress?: string; telNumber?: string };
  buyer?: { firstName?: string; lastName?: string };
}

/**
 * Sells tickets on the account of the signed-in staff member, paid at the counter: empties their
 * cart, adds the tickets, picks the box office payment provider and checks out.
 */
export const useBoxOfficeSale = () => {
  const client = useApolloClient();

  const sell = async ({ quantities, attendees, contact, buyer }: BoxOfficeSale) => {
    const items = buildBoxOfficeItems(quantities, attendees);
    if (!items.length) throw new Error('NO_TICKETS');

    const { data } = await client.query<any>({ query: BoxOfficeCartQuery, fetchPolicy: 'network-only' });
    const cart = data?.me?.cart;
    if (cart?.items?.length) {
      await client.mutate({ mutation: EmptyBoxOfficeCartMutation, variables: { orderId: cart._id } });
    }

    const { data: added } = await client.mutate<any>({
      mutation: AddBoxOfficeItemsMutation,
      variables: { orderId: cart?._id || null, items },
    });
    const order = added.addMultipleCartProducts;
    const provider = findBoxOfficeProvider(order.supportedPaymentProviders);
    if (!provider) throw new Error('NO_BOX_OFFICE_PROVIDER');

    // Checkout needs a contact and a billing address. Both are set on every sale, so a sale never
    // keeps the buyer of the previous one; without buyer details they stay empty.
    await client.mutate({
      mutation: UpdateBoxOfficeCartMutation,
      variables: {
        orderId: order._id,
        paymentProviderId: provider._id,
        contact: {
          emailAddress: contact?.emailAddress || null,
          telNumber: contact?.telNumber || null,
        },
        billingAddress: {
          firstName: buyer?.firstName || null,
          lastName: buyer?.lastName || null,
        },
      },
    });

    const { data: checkedOut } = await client.mutate<any>({
      mutation: CheckoutBoxOfficeCartMutation,
      variables: { orderId: order._id },
    });
    return checkedOut.checkoutCart;
  };

  return { sell };
};

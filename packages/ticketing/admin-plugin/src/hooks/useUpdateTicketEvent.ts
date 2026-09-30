import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import type { UpdateTicketEventInput } from '../utils/event-form.ts';

// Returns the fields the event pages read, so the cached event shows the new details at once.
const UpdateTicketEventMutation = gql`
  mutation UpdateTicketEvent($productId: ID!, $event: UpdateTicketEventInput!) {
    updateTicketEvent(productId: $productId, event: $event) {
      _id
      ... on TokenizedProduct {
        event {
          startsAt
          endsAt
          doorsOpenAt
          location
          category
          durationMinutes
          doorsOpenMinutesBefore
          overridden
          ownSaleRules {
            onSale
            salesStart
            salesEnd
            maxPerOrder
          }
        }
        contractConfiguration {
          supply
        }
      }
    }
  }
`;

/** Needs manageProducts; the start and category of a date of a production are changed through the production. */
const useUpdateTicketEvent = () => {
  const [updateTicketEventMutation] = useMutation<any>(UpdateTicketEventMutation);

  const updateTicketEvent = async ({
    productId,
    event,
  }: {
    productId: string;
    // Partial for the dates of a production, which only send what changed
    event: Partial<UpdateTicketEventInput> & { saleRules?: Record<string, unknown> };
  }) => {
    const { data } = await updateTicketEventMutation({ variables: { productId, event } });
    return data?.updateTicketEvent;
  };

  return { updateTicketEvent };
};

export default useUpdateTicketEvent;

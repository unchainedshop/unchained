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
        }
        contractConfiguration {
          supply
        }
      }
    }
  }
`;

/** Needs manageProducts; fails with ProductWrongStatusError until the product has a ticket supply. */
const useUpdateTicketEvent = () => {
  const [updateTicketEventMutation] = useMutation<any>(UpdateTicketEventMutation);

  const updateTicketEvent = async ({
    productId,
    event,
  }: {
    productId: string;
    event: UpdateTicketEventInput;
  }) => {
    const { data } = await updateTicketEventMutation({ variables: { productId, event } });
    return data?.updateTicketEvent;
  };

  return { updateTicketEvent };
};

export default useUpdateTicketEvent;

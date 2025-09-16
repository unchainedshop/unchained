import { gql } from '@apollo/client';

const EventFragment = gql`
  fragment EventFragment on Event {
    _id
    type
    payload
    created
  }
`;

export default EventFragment;

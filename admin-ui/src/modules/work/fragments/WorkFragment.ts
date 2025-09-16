import { gql } from '@apollo/client';

const WorkFragment = gql`
  fragment WorkFragment on Work {
    _id
    type
    scheduled
    status
    started
    success
    finished
    created
    deleted
    retries
    original {
      _id
      retries
    }
  }
`;

export default WorkFragment;

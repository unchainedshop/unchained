import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import TokenFragment from '../../product/fragments/TokenFragment';

const InvalidateTokenMutation = gql`
  mutation InvalidateToken($tokenId: ID!) {
    invalidateToken(tokenId: $tokenId) {
      ...TokenFragment
    }
  }
  ${TokenFragment}
`;

const useInvalidateTicket = () => {
  const [invalidateTokenMutation] = useMutation(InvalidateTokenMutation);

  const invalidateTicket = async ({ tokenId }) => {
    const result = await invalidateTokenMutation({
      variables: { tokenId },
      refetchQueries: ['Tokens', 'Token'],
    });
    return result;
  };
  return { invalidateTicket };
};

export default useInvalidateTicket;

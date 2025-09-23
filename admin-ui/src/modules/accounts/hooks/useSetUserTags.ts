import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetUserTagsMutation,
  ISetUserTagsMutationVariables,
} from '../../../gql/types';

const SetUserTagsMutation = gql`
  mutation SetUserTags($tags: [LowerCaseString]!, $userId: ID!) {
    setUserTags(tags: $tags, userId: $userId) {
      _id
      tags
    }
  }
`;

const useSetUserTags = () => {
  const [setUserTagsMutation] = useMutation<
    ISetUserTagsMutation,
    ISetUserTagsMutationVariables
  >(SetUserTagsMutation);

  const setUserTags = async ({
    tags = [],
    userId = null,
  }: ISetUserTagsMutationVariables) => {
    return setUserTagsMutation({
      variables: {
        tags,
        userId,
      },
      refetchQueries: ['Users', 'User', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    setUserTags,
  };
};

export default useSetUserTags;

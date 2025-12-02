import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ITagsCountQuery, ITagsCountQueryVariables } from '../../../gql/types';

const TagCountQuery = gql`
  query TagsCount($tag: LowerCaseString!) {
    productsCount(tags: [$tag])
    assortmentsCount(tags: [$tag])
  }
`;

const useTagsCount = ({ tag }) => {
    const { data, loading } = useQuery<ITagsCountQuery, ITagsCountQueryVariables>(
        TagCountQuery,
        {
            skip: !tag,
            variables: {
                tag,
            },
        },
    );
    return {
        assortmentsCount: data?.assortmentsCount ?? 0,
        productsCount: data?.productsCount ?? 0,
        loading,
    };
};

export default useTagsCount;
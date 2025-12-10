import { ApolloClient, gql } from '@apollo/client';
import {
  IAssortmentExistQuery,
  IAssortmentExistQueryVariables,
} from '../../../gql/types';

const AssortmentExistsQuery = gql`
  query AssortmentExist($assortmentId: ID, $slug: String) {
    assortment(assortmentId: $assortmentId, slug: $slug) {
      _id
      deleted
    }
  }
`;

export async function fetchExistingAssortmentId(
  assortmentId: string,
  client: ApolloClient,
) {
  const { data } = await client.query<
    IAssortmentExistQuery,
    IAssortmentExistQueryVariables
  >({
    query: AssortmentExistsQuery,
    variables: { assortmentId },
  });
  const { assortment } = data;

  if (!assortment || assortment?.deleted) {
    return null;
  }
  return assortment?._id;
}

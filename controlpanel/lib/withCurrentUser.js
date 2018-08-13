import { compose, mapProps } from 'recompose';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export default compose(
  graphql(gql`
    query getCurrentUser {
      me {
       _id
       name
       isGuest
       email
     }
    }
  `),
  mapProps(({ data: { me, loading }, loading: loadingPredecessor = false, ...rest }) => ({
    currentUser: me || {},
    loading: !me && (loading || loadingPredecessor),
    ...rest,
  })),
);

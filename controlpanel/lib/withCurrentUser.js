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
       roles
     }
    }
  `),
  mapProps(({ data: { me, loading }, loading: loadingPredecessor = false, ...rest }) => {
    const currentUser = me
      ? (me.roles.indexOf('admin') !== -1 && me)
      : {};
    return {
      currentUser,
      loading: !me && (loading || loadingPredecessor),
      ...rest,
    };
  }),
);

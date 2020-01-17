import { compose, mapProps } from 'recompose';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export default compose(
  graphql(
    gql`
      query getCurrentUser {
        me {
          _id
          name
          isGuest
          primaryEmail {
            address
            verified
          }
          roles
        }
      }
    `,
    {
      options: {
        fetchPolicy: 'network-only'
      }
    }
  ),
  mapProps(({ data: { me, loading }, ...rest }) => {
    const currentUser = me
      ? (me.roles || []).indexOf('admin') !== -1 && me
      : null;
    return {
      currentUser,
      loading,
      ...rest
    };
  })
);

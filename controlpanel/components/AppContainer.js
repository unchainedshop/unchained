import { compose, lifecycle, withProps } from 'recompose';
import { graphql } from 'react-apollo';
import Router from 'next/router';
import gql from 'graphql-tag';
import App from './App';

export default compose(
  graphql(gql`
    query getCurrentUser {
      me {
       _id
       name
       isGuest
     }
    }
  `),
  withProps(({ data: { me, loading } }) => ({
    loggedInUser: me,
    userIsGuest: !me || (me && me.isGuest),
    loading,
  })),
  lifecycle({
    async componentWillReceiveProps({
      loggedInUser, noRedirect, allowAnonymousAccess, loading,
    }) {
      if (noRedirect) return;
      if (!allowAnonymousAccess && !loading && !loggedInUser) {
        Router.push('/sign-in');
      }
      if (allowAnonymousAccess && !loading && loggedInUser) {
        Router.push('/');
      }
    },
  }),
)(App);

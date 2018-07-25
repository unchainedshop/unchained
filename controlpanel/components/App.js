import React from 'react';
import { withRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import { Segment, Dimmer, Loader } from 'semantic-ui-react';
import { compose, lifecycle, withProps } from 'recompose';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-phone-number-input/style.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-rte/lib/Draft.global.css';
import 'react-rte/lib/RichTextEditor.css';
import 'semantic-ui-css/semantic.min.css';
import 'semantic-ui-css/themes/default/assets/fonts/icons.eot';
import 'semantic-ui-css/themes/default/assets/fonts/icons.woff';
import 'semantic-ui-css/themes/default/assets/fonts/icons.woff2';
import Header from './Header';

const App = ({
  loggedInUser, loading, children, router,
}) => (
  <main>
    <Header
      loading={loading}
      pathname={router.pathname}
      loggedInUser={loggedInUser}
    />
    <Segment vertical padded>
      {loading && (
        <Dimmer active inverted>
          <Loader size="large" inverted>
Laden
          </Loader>
        </Dimmer>
      ) }
      {children}
    </Segment>
    <Segment basic textAlign="center">
      Made with
      {' '}
      <span role="img" aria-label="love">
❤️
      </span>
      {' '}
by the
      {' '}
      <a href="https://unchained.shop">
Unchained Team
      </a>
    </Segment>
    <ToastContainer
      position="top-center"
      autoClose={3000}
    />
  </main>
);

export default compose(
  withRouter,
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
      loggedInUser, noRedirect, allowAnonymousAccess, loading, router,
    }) {
      if (noRedirect) return;
      if (!allowAnonymousAccess && !loading && !loggedInUser) {
        router.push('/sign-in');
      }
      if (allowAnonymousAccess && !loading && loggedInUser) {
        router.push('/');
      }
    },
  }),
)(App);

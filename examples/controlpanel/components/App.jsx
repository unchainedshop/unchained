import 'core-js/es';
import React from 'react';
import { withRouter } from 'next/router';
import { ToastContainer } from 'react-toastify';
import { Segment, Dimmer, Loader } from 'semantic-ui-react';
import compose from 'recompose/compose';
import withCurrentUser from '../lib/withCurrentUser';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-phone-number-input/style.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-rte/lib/Draft.global.css';
import 'react-rte/lib/RichTextEditor.css';
import 'semantic-ui-less/semantic.less';
import 'uniforms-bridge-simple-schema-2';
import Header from './Header';
import Redirect from './Redirect';

const App = ({
  currentUser,
  loading,
  children,
  router,
  allowAnonymousAccess,
}) => (
  <main>
    <Header
      loading={loading}
      pathname={router.pathname}
      loggedInUser={currentUser}
    />
    {allowAnonymousAccess ? (
      <Redirect to="/" ifLoggedIn />
    ) : (
      <Redirect to="/sign-in" />
    )}
    <Segment vertical padded>
      {loading && (
        <Dimmer active inverted>
          <Loader size="large" inverted>
            Loading
          </Loader>
        </Dimmer>
      )}
      {children}
    </Segment>
    <Segment basic textAlign="center">
      Made with &nbsp;
      <span role="img" aria-label="tons of beers">
        🍫
      </span>
      &nbsp; by the &nbsp;
      <a href="https://unchained.shop">Unchained Team</a>
    </Segment>
    <ToastContainer position="top-center" autoClose={3000} />
  </main>
);

export default compose(withRouter, withCurrentUser)(App);

import React from 'react';
import { ToastContainer } from 'react-toastify';
import { Segment, Dimmer, Loader } from 'semantic-ui-react';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-phone-number-input/rrui.css';
import 'react-phone-number-input/style.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-rte/lib/Draft.global.css';
import 'react-rte/lib/RichTextEditor.css';
import 'semantic-ui-css/semantic.min.css';
import 'semantic-ui-css/themes/default/assets/fonts/icons.eot';
import 'semantic-ui-css/themes/default/assets/fonts/icons.woff';
import 'semantic-ui-css/themes/default/assets/fonts/icons.woff2';
import Header from './Header';

export default ({
  url, loggedInUser, loading, children,
}) => (
  <main>
    <Header
      loading={loading}
      pathname={url.pathname}
      loggedInUser={loggedInUser}
    />
    <Segment vertical padded>
      {loading && (
        <Dimmer active inverted>
          <Loader size="large" inverted>Laden</Loader>
        </Dimmer>
      ) }
      {children}
    </Segment>
    <ToastContainer
      position="top-center"
      autoClose={3000}
    />
  </main>
);

import React from 'react';
import cookie from 'cookie';
import { differenceInMilliseconds } from 'date-fns';
import PropTypes from 'prop-types';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import Head from 'next/head';
import { onTokenChange } from './accounts';
import initApollo from './initApollo';

function parseCookies(ctx = {}, options = {}) {
  return cookie.parse(
    (ctx.req && ctx.req.headers.cookie) // eslint-disable-line
      ? ctx.req.headers.cookie
      : process.browser
      ? document.cookie
      : '',
    options
  );
}

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

export default ComposedComponent =>
  class WithData extends React.Component {
    static displayName = `WithData(${getComponentDisplayName(
      ComposedComponent
    )})`;

    static propTypes = {
      serverState: PropTypes.object.isRequired, //eslint-disable-line
    };

    constructor(props) {
      super(props);

      const { serverState, headers } = this.props;

      this.apollo = initApollo(
        serverState.apollo.data,
        headers,
        () => parseCookies({}).token
      );
      onTokenChange(async ({ token, tokenExpires }) => {
        if (!token || !tokenExpires) {
          document.cookie = cookie.serialize('token', '', {
            maxAge: -1 // Expire the cookie immediately
          });
          document.cookie = cookie.serialize('token', '', {
            maxAge: -1, // Expire the cookie immediately
            path: '/'
          });
          this.apollo.resetStore();
          return;
        }
        const maxAge =
          differenceInMilliseconds(new Date(tokenExpires), new Date()) / 1000;
        console.debug('new token, expiring: ', maxAge); // eslint-disable-line
        document.cookie = cookie.serialize('token', token, {
          maxAge,
          path: '/'
        });
        this.apollo.resetStore();
      });
    }

    static async getInitialProps(ctx) {
      // Initial serverState with apollo (empty)
      let serverState = { apollo: {} };
      const headers = ctx.req ? ctx.req.headers : {};

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps(ctx);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      if (!process.browser) {
        const apollo = initApollo(null, headers, () => parseCookies(ctx).token);
        try {
          // Run all GraphQL queries
          await getDataFromTree(
            <ApolloProvider client={apollo}>
              <ComposedComponent {...composedInitialProps} />
          </ApolloProvider>); //eslint-disable-line
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // http://dev.apollodata.com/react/api-queries.html#graphql-query-data-error
        }
        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind();

        // Extract query data from the Apollo store
        serverState = {
          apollo: {
            data: apollo.cache.extract()
          }
        };
      }

      return {
        serverState,
        headers,
        ...composedInitialProps
      };
    }

    render() {
      return (
        <ApolloProvider client={this.apollo}>
          <ComposedComponent {...this.props} />
        </ApolloProvider>
      );
    }
  };

import React from 'react';
import cookie from 'cookie';
import moment from 'moment';
import PropTypes from 'prop-types';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import Head from 'next/head';
import { onTokenChange } from './accounts';
import initApollo from './initApollo';

function parseCookies(ctx = {}, options = {}) {
  return cookie.parse(
    (ctx.req && ctx.req.headers.cookie) // eslint-disable-line
      ? ctx.req.headers.cookie
      : (process.browser ? document.cookie : ''),
    options,
  );
}

// Gets the display name of a JSX component for dev tools
function getComponentDisplayName(Component) {
  return Component.displayName || Component.name || 'Unknown';
}

export default ComposedComponent => class WithData extends React.Component {
    static displayName = `WithData(${getComponentDisplayName(ComposedComponent)})`
    static propTypes = {
      serverState: PropTypes.object.isRequired, //eslint-disable-line
    }

    static async getInitialProps(ctx) {
      // Initial serverState with apollo (empty)
      let serverState = { apollo: { } };
      const headers = ctx.req ? ctx.req.headers : {};

      // Evaluate the composed component's getInitialProps()
      let composedInitialProps = {};
      if (ComposedComponent.getInitialProps) {
        composedInitialProps = await ComposedComponent.getInitialProps(ctx);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      if (!process.browser) {
        const apollo = initApollo(
          null,
          headers,
          () => parseCookies(ctx).token,
        );
        // Provide the `url` prop data in case a GraphQL query uses it
        const url = { query: ctx.query, pathname: ctx.pathname };
        try {
          // Run all GraphQL queries
          await getDataFromTree(<ApolloProvider client={apollo}>
            <ComposedComponent url={url} {...composedInitialProps} />
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
            data: apollo.cache.extract(),
          },
        };
      }

      return {
        serverState,
        headers,
        ...composedInitialProps,
      };
    }

    constructor(props) {
      super(props);
      this.apollo = initApollo(
        this.props.serverState.apollo.data,
        this.props.headers,
        () => parseCookies({}).token,
      );
      onTokenChange(async ({ token, tokenExpires }) => {
        if (!token || !tokenExpires) {
          console.log('logged out'); // eslint-disable-line
          document.cookie = cookie.serialize('token', '', {
            maxAge: -1, // Expire the cookie immediately
          });
          this.apollo.resetStore();
          return;
        }
        const maxAge = moment().diff(new Date(tokenExpires), 'seconds') * -1;
        console.debug('new token, expiring: ', maxAge); // eslint-disable-line
        document.cookie = cookie.serialize('token', token, { maxAge });
        this.apollo.resetStore();
      });
    }

    render() {
      return (
        <ApolloProvider client={this.apollo}>
          <ComposedComponent {...this.props} />
        </ApolloProvider>
      );
    }
};

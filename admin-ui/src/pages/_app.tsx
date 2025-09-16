import { ApolloProvider } from '@apollo/client/react';
import App from 'next/app';
import { Router } from 'next/router';
import { ToastContainer } from 'react-toastify';
import React, { useEffect } from 'react';
import { useApollo } from '../modules/apollo/apolloClient';
import '../styles/globals.css';
import getMessages from '../modules/i18n/utils/getMessages';
import IntlWrapper from '../modules/i18n/components/IntlWrapper';
import Layout from '../modules/common/components/Layout';
import ModalWrapper from '../modules/modal/components/ModalWrapper';

import ThemeWrapper from '../modules/common/components/ThemeWrapper';
import * as matomo from '../modules/common/utils/matomo';
import ThemeToggle from '../modules/common/components/ThemeToggle';
import UnchainedContextWrapper from '../modules/UnchainedContext/UnchainedContextWrapper';
import ErrorBoundary from '../modules/common/components/ErrorBoundary';
import Head from 'next/head';
import Script from 'next/script';
import AuthWrapper from '../modules/Auth/AuthWrapper';
import { ChatProvider } from '../modules/copilot/ChatContext';
import ImageWithFallback from '../modules/common/components/ImageWithFallback';
import { AppContextWrapper } from '../modules/common/components/AppContext';

const handleRouteChange = (url) => {
  matomo.pageView(document.location.origin + url, document.title);
};

const UnchainedAdmin = ({ Component, componentName, pageProps, router }) => {
  const apollo = useApollo(pageProps);

  const getLayout = Component.getLayout
    ? (page) => (
        <AuthWrapper>
          <div className="absolute top-4 left-4">
            <ImageWithFallback
              src={process.env.NEXT_PUBLIC_LOGO}
              width={32}
              height={20}
              alt="Logo"
              className="dark:brightness-0 dark:invert"
            />
          </div>
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          {Component.getLayout(page)}
        </AuthWrapper>
      )
    : (page) => <Layout componentName={componentName}>{page}</Layout>;

  // Always start with default locale to avoid hydration mismatch
  // The actual locale will be updated after hydration in IntlWrapper
  const getEffectiveLocale = () => {
    return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'de'; // Default to German to ensure server/client consistency
  };

  const effectiveLocale = getEffectiveLocale();
  const messages = getMessages(effectiveLocale);

  useEffect(() => {
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [apollo]);

  return (
    <IntlWrapper
      locale={effectiveLocale}
      messages={messages}
      key="intl-provider"
    >
      <ErrorBoundary>
        <Head>
          <title>Unchained: Admin UI</title>
          {process.env.NEXT_PUBLIC_MATOMO_SITE_ID ? (
            <>
              <Script
                id="matomo-script"
                src={`${process.env.NEXT_PUBLIC_MATOMO_URL}/matomo.js`}
              />
              <Script
                id="matomo-config"
                dangerouslySetInnerHTML={{
                  __html: `
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  _paq.push(['setTrackerUrl', '${process.env.NEXT_PUBLIC_MATOMO_URL}/matomo.php']);
  _paq.push(['setSiteId', '${process.env.NEXT_PUBLIC_MATOMO_SITE_ID}']);
  `,
                }}
              />
            </>
          ) : null}
        </Head>
        <ApolloProvider client={apollo}>
          <AppContextWrapper>
            <UnchainedContextWrapper>
              <ThemeWrapper>
                <ChatProvider>
                  <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    newestOnTop={false}
                    closeOnClick
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />
                  <ModalWrapper>
                    {getLayout(<Component {...pageProps} />)}
                  </ModalWrapper>
                </ChatProvider>
              </ThemeWrapper>
            </UnchainedContextWrapper>
          </AppContextWrapper>
        </ApolloProvider>
      </ErrorBoundary>
    </IntlWrapper>
  );
};

UnchainedAdmin.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);

  const componentName =
    appContext.Component.displayName || appContext.Component.name || 'Unknown';
  return { ...appProps, componentName };
};

export default UnchainedAdmin;

import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';

const {
  LANG,
  TRACKING_CODE,
  GRAPHQL_ENDPOINT,
} = process.env;

export default class IntlDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <link rel="stylesheet" href="/_next/static/style.css" />
        </Head>
        <body>
          <Main />
          <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=Intl.~locale.de,Intl.~locale.en,Intl.~locale.fr" />
          <script dangerouslySetInnerHTML={{ // eslint-disable-line
            __html: `window.ENV = '${JSON.stringify({
              LANG,
              TRACKING_CODE,
              GRAPHQL_ENDPOINT,
            })}';`,
          }}
          />
          <NextScript />
        </body>
      </html>
    );
  }
}

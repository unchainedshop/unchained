require('dotenv-extended').load();
const path = require('path');
const withCss = require('@zeit/next-css');
const withLess = require('@zeit/next-less');

const {
  UNCHAINED_LANG,
  GRAPHQL_ENDPOINT,
  DEBUG = false,
  ROOT_URL,
  BUNDLE_ANALYZE = false,
} = process.env;

module.exports = withCss(
  withLess({
    trailingSlash: true,
    assetPrefix: ROOT_URL || '',
    analyzeServer: ['server', 'both'].includes(BUNDLE_ANALYZE),
    analyzeBrowser: ['browser', 'both'].includes(BUNDLE_ANALYZE),
    bundleAnalyzerConfig: {
      server: {
        analyzerMode: 'static',
        reportFilename: '../.next/server.html',
      },
      browser: {
        analyzerMode: 'static',
        reportFilename: '../.next/client.html',
      },
    },
    publicRuntimeConfig: {
      // Will be available on both server and client
      UNCHAINED_LANG,
      GRAPHQL_ENDPOINT,
      DEBUG,
    },
    webpack(config) {
      const newConfig = config;
      newConfig.resolve.alias['../../theme.config$'] = path.resolve(
        __dirname,
        'semantic-ui/theme.config',
      );
      newConfig.module.rules.push({
        test: /\.(png|svg|jpg|eot|otf|ttf|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 100000,
            esModule: false,
            publicPath: './',
            outputPath: 'static/',
            name: '[name].[ext]',
          },
        },
      });
      return newConfig;
    },
  }),
);

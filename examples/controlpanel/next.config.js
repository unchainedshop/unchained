require('dotenv').config();
const withCss = require('@zeit/next-css');

const {
  LANG,
  GRAPHQL_ENDPOINT,
  DEBUG = false,
  ROOT_URL,
  BUNDLE_ANALYZE = false,
} = process.env;

module.exports = withCss({
  exportTrailingSlash: true,
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
    LANG,
    GRAPHQL_ENDPOINT,
    DEBUG,
  },
  webpack(config) {
    const newConfig = config;
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
});

require('dotenv').config();
const withCss = require('@zeit/next-css');

const {
  LANG,
  GRAPHQL_ENDPOINT,
  DEBUG,
} = process.env;

module.exports = withCss({
  publicRuntimeConfig: { // Will be available on both server and client
    LANG,
    GRAPHQL_ENDPOINT,
    DEBUG,
  },
  webpack(config) {
    const newConfig = config;
    newConfig.module.rules.push({
      test: /\.(png|svg|eot|otf|ttf|woff|woff2)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 100000,
          publicPath: './',
          outputPath: 'static/',
          name: '[name].[ext]',
        },
      },
    });
    return newConfig;
  },
});

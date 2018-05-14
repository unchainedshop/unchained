const withCss = require('@zeit/next-css');

module.exports = withCss({
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

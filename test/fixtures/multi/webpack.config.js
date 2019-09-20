const { resolve } = require('path');

module.exports = [
  {
    resolve: {
      alias: {
        'webpack-hmr-client/client': resolve(__dirname, '../../../lib/client'),
      },
    },
    context: __dirname,
    entry: [resolve(__dirname, './client.js')],
    mode: 'development',
    output: {
      filename: './output.client.js',
      path: resolve(__dirname),
    },
  },
  {
    resolve: {
      alias: {
        'webpack-hmr-client/client': resolve(__dirname, '../../../lib/client'),
      },
    },
    context: __dirname,
    entry: [resolve(__dirname, './server.js')],
    mode: 'development',
    output: {
      filename: './output.server.js',
      path: resolve(__dirname),
    },
  },
];

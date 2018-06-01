const path = require('path');

const TimeFixPlugin = require('time-fix-plugin');
const webpack = require('webpack');

module.exports = {
  resolve: {
    alias: {
      'webpack-hot-client/client': path.resolve(__dirname, '../../client'),
    },
  },
  context: __dirname,
  devtool: 'source-map',
  entry: {
    main: ['./app.js'],
  },
  output: {
    filename: './output.js',
    path: path.resolve(__dirname),
  },
  plugins: [new webpack.NamedModulesPlugin(), new TimeFixPlugin()],
};

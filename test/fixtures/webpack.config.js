'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: ['./entry.js'],
  mode: 'development',
  output: {
    filename: './output.js',
    path: path.resolve(__dirname)
  },
  watch: true,
  plugins: [
    new webpack.NamedModulesPlugin()
  ]
};

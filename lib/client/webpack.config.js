'use strict';

const path = require('path');

module.exports = {
  context: __dirname,
  mode: 'development',
  entry: ['./index.js'],
  output: {
    filename: 'index-TEST.js',
    path: path.resolve(__dirname, '../../client')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

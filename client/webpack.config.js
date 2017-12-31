'use strict';

const path = require('path');

module.exports = {
  mode: 'development',
  output: {
    filename: 'client-dist.js',
    path: path.resolve(__dirname, '../')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

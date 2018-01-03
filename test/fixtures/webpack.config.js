'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: ['./entry.js', `../../client/?${+new Date()}`],
  mode: 'development',
  output: {
    filename: './output.js',
    path: path.resolve(__dirname)
  },
  watch: true,
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    rules: [
      {
        test: /\/client\/.*\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['env', {
                targets: {
                  browsers: ['last 2 versions']
                }
              }]
            ]
          }
        }
      }
    ]
  }
};

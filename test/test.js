'use strict';

/* eslint global-require: off */

if (parseInt(process.version.substring(1), 10) < 8) {
  require('@babel/polyfill');
  require('@babel/register')({
    ignore: [/node_modules\/(?!koa)/],
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: '6.11'
        }
      }]
    ]
  });
}

require('loud-rejection/register');

global.expect = require('expect');

require('./tests/init');
require('./tests/options');
require('./tests/sockets');

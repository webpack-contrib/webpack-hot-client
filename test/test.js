'use strict';

/* eslint global-require: off */

if (parseInt(process.version.substring(1), 10) < 8) {
  require('@babel/polyfill');
  require('@babel/register')({
    ignore: [/node_modules\/(?!koa)/],
    plugins: ['@babel/plugin-syntax-async-generators']
  });
}

require('./sockets');

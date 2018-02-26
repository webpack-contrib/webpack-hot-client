'use strict';

/* eslint global-require: off */
/* global window */

const http = require('http');
const assert = require('assert');
const webpack = require('webpack');
const client = require('../../index');

describe('Webpack Hot Client', () => {
  it('should exist', () => {
    assert(client);
  });

  it('should reject string entry', () => {
    const config = require('../fixtures/webpack.config-invalid.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };

    assert.throws(() => { client(compiler, options); });
  });

  it('should reject object with string entry', () => {
    const config = require('../fixtures/webpack.config-invalid-object.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };

    assert.throws(() => { client(compiler, options); });
  });

  it('should allow object with string array entry', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('should allow passing koa server instance', (done) => {
    const server = http.createServer();

    server.listen(1337, '127.0.0.1', () => {
      const config = require('../fixtures/webpack.config.js');
      const compiler = webpack(config);
      const options = { hot: true, logLevel: 'info', server };
      const { close } = client(compiler, options);

      setTimeout(() => {
        server.close(() => close(done));
      }, 1000);
    });
  });

  it('should function with MultiCompiler config', (done) => {
    const config = require('../fixtures/multi/webpack.config.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);
});

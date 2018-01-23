'use strict';

/* eslint global-require: off */
/* global window */

const assert = require('assert');
const Koa = require('koa');
const webpack = require('webpack');
const WebSocket = require('ws');
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

    setTimeout(() => { close(done); }, 1000);
  });

  it('should allow passing koa server instance', (done) => {
    const app = new Koa();
    const server = app.listen(8081);
    const config = require('../fixtures/webpack.config.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info', server };
    const { close, wss } = client(compiler, options);

    setTimeout(() => {
      // eslint-disable-next-line no-underscore-dangle
      const { address, port } = wss._server.address();
      const socket = new WebSocket(`ws://${address}:${port}`);

      socket.on('open', () => {
        close(done);
      });
    }, 1000);
  });
});

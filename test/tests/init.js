'use strict';

/* eslint global-require: off */
/* global window */

const http = require('http');
const assert = require('assert');
const webpack = require('webpack');
const client = require('../../index');

describe('Webpack Hot Client', () => {
  beforeEach(() => {
    process.env.WHC_TARGET = '';
  });

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

  it('should allow string array entry', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('should allow object with string array entry', (done) => {
    const config = require('../fixtures/webpack.config-object.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('should set WHC_TARGET to web', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => {
      assert.equal(process.env.WHC_TARGET, 'web');
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow setting WHC_TARGET', (done) => {
    process.env.WHC_TARGET = 'electron-renderer';

    const config = require('../fixtures/webpack.config-array.js');
    config.target = 'electron-renderer';

    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => {
      assert.equal(process.env.WHC_TARGET, 'electron-renderer');
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow setting host', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: '0.0.0.0', hot: true, logLevel: 'info' };
    const { close, wss } = client(compiler, options);

    setTimeout(() => {
      assert.equal(wss._server.address().address, options.host); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow setting host object', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = {
      host: { client: '127.0.0.1', server: '127.0.0.1' },
      hot: true,
      logLevel: 'info'
    };
    const { close, options: opts, wss } = client(compiler, options);

    assert.equal(opts.host.client, options.host.client);
    assert.equal(opts.webSocket.host, options.host.client);
    assert.equal(opts.host.server, options.host.server);

    setTimeout(() => {
      assert.equal(wss._server.address().address, options.host.server); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow setting host object with different client', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = {
      host: { client: '127.0.0.1', server: '0.0.0.0' },
      hot: true,
      logLevel: 'info'
    };
    const { close, options: opts, wss } = client(compiler, options);

    assert.equal(opts.host.client, options.host.client);
    assert.equal(opts.webSocket.host, options.host.client);
    assert.equal(opts.host.server, options.host.server);

    setTimeout(() => {
      assert.equal(wss._server.address().address, options.host.server); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow function entry that returns array', (done) => {
    const config = require('../fixtures/webpack.config-function.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => {
      compiler.run(() => { close(done); });
    }, 2000);
  }).timeout(4000);

  it('should reject function entry that returns string', (done) => {
    const config = require('../fixtures/webpack.config-function-invalid.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info' };
    const { close } = client(compiler, options);

    setTimeout(() => {
      assert.throws(() => { compiler.run(); }, TypeError, /must be an Array/);
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should not allow setting host object missing server', () => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: { client: 'localhost' } };

    assert.throws(() => { client(compiler, options); });
  });

  it('should not allow setting host object missing client', () => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: { server: 'localhost' } };

    assert.throws(() => { client(compiler, options); });
  });

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

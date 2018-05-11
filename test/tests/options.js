'use strict';

/* eslint global-require: off */

const webpack = require('webpack');
const client = require('../../index');

const logLevel = 'silent';

describe('Options', () => {
  it('autoConfigure: false', (done) => {
    const config = require('../fixtures/webpack.config-invalid.js');
    const compiler = webpack(config);
    const options = { autoConfigure: false, hot: true, logLevel };

    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('host', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: '0.0.0.0', hot: true, logLevel };
    const { close, wss } = client(compiler, options);

    setTimeout(() => {
      expect(wss._server.address().address).toBe(options.host); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('host; client, server', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = {
      host: { client: '127.0.0.1', server: '127.0.0.1' },
      hot: true,
      logLevel
    };
    const { close, options: opts, wss } = client(compiler, options);

    expect(opts.host.client).toBe(options.host.client);
    expect(opts.webSocket.host).toBe(options.host.client);
    expect(opts.host.server).toBe(options.host.server);

    setTimeout(() => {
      expect(wss._server.address().address).toBe(options.host.server); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('host; different server, client', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = {
      host: { client: '127.0.0.1', server: '0.0.0.0' },
      hot: true,
      logLevel
    };
    const { close, options: opts, wss } = client(compiler, options);

    expect(opts.host.client).toBe(options.host.client);
    expect(opts.webSocket.host).toBe(options.host.client);
    expect(opts.host.server).toBe(options.host.server);

    setTimeout(() => {
      expect(wss._server.address().address).toBe(options.host.server); // eslint-disable-line no-underscore-dangle
      close(done);
    }, 2000);
  }).timeout(4000);

  it('host without server', () => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: { client: 'localhost' } };

    expect(() => { client(compiler, options); }).toThrow();
  });

  it('host without client', () => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { host: { server: 'localhost' } };

    expect(() => { client(compiler, options); }).toThrow();
  });

  it('server', (done) => {
    const http = require('http');
    const server = http.createServer();

    server.listen(1337, '127.0.0.1', () => {
      const config = require('../fixtures/webpack.config.js');
      const compiler = webpack(config);
      const options = { hot: true, logLevel, server };
      const { close } = client(compiler, options);

      setTimeout(() => {
        server.close(() => close(done));
      }, 1000);
    });
  });
});

/* eslint-disable global-require */

const webpack = require('webpack');
const WebSocket = require('ws');

const client = require('../lib');

const logLevel = 'silent';
const options = { logLevel };
const validTypes = ['compile', 'hash', 'ok', 'warnings'];

describe('api', () => {
  test('array config', (done) => {
    const config = require('./fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const { server } = client(compiler, options);

    server.on('listening', () => {
      const { host, port } = server;
      const socket = new WebSocket(`ws://${host}:${port}`);

      socket.on('message', (raw) => {
        const data = JSON.parse(raw);

        expect(validTypes).toContain(data.type);

        if (data.type === 'hash') {
          server.close(done);
        }
      });

      socket.on('open', () => {
        compiler.run(() => {});
      });
    });
  });

  test('object config', (done) => {
    const config = require('./fixtures/webpack.config-object.js');
    const compiler = webpack(config);
    const { server } = client(compiler, options);

    server.on('listening', () => {
      const { host, port } = server;
      const socket = new WebSocket(`ws://${host}:${port}`);

      socket.on('message', (raw) => {
        const data = JSON.parse(raw);

        expect(validTypes).toContain(data.type);

        if (data.type === 'hash') {
          server.close(done);
        }
      });

      socket.on('open', () => {
        compiler.run(() => {});
      });
    });
  });

  test('function returns array', (done) => {
    const config = require('./fixtures/webpack.config-function.js');
    const compiler = webpack(config);
    const { server } = client(compiler, options);

    server.on('listening', () => {
      const { host, port } = server;
      const socket = new WebSocket(`ws://${host}:${port}`);

      socket.on('message', (raw) => {
        const data = JSON.parse(raw);

        expect(validTypes).toContain(data.type);

        if (data.type === 'hash') {
          server.close(done);
        }
      });

      socket.on('open', () => {
        compiler.run(() => {});
      });
    });
  });

  test('MultiCompiler config', (done) => {
    const config = require('./fixtures/multi/webpack.config.js');
    const compiler = webpack(config);
    const { server } = client(compiler, options);

    server.on('listening', () => {
      const { host, port } = server;
      const socket = new WebSocket(`ws://${host}:${port}`);

      socket.on('message', (raw) => {
        const data = JSON.parse(raw);

        expect(validTypes).toContain(data.type);

        if (data.type === 'hash') {
          server.close(done);
        }
      });

      socket.on('open', () => {
        compiler.run(() => {});
      });
    });
  });
});

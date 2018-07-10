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

        if (data.type === 'errors') {
          console.log(data); // eslint-disable-line no-console
        }

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

  test('options sanity check', (done) => {
    const config = require('./fixtures/webpack.config-object.js');
    const compiler = webpack(config);
    const { options: opts, server } = client(compiler, options);

    server.on('listening', () => {
      const { host, port } = server;
      expect({ host, port }).toMatchSnapshot();
      expect(opts).toMatchSnapshot();

      setTimeout(() => server.close(done), 500);
    });
  });

  test('mismatched client/server options sanity check', (done) => {
    const config = require('./fixtures/webpack.config-object.js');
    const compiler = webpack(config);
    const clientOptions = Object.assign({}, options, {
      host: {
        client: 'localhost',
        server: '0.0.0.0',
      },
      port: {
        client: 6000,
        server: 7000,
      },
    });
    const { options: opts, server } = client(compiler, clientOptions);

    server.on('listening', () => {
      const { host, port } = server;
      expect({ host, port }).toMatchSnapshot();
      expect(opts).toMatchSnapshot();

      setTimeout(() => server.close(done), 500);
    });
  });
});

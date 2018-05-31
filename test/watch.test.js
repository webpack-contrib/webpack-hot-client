/* eslint-disable global-require */
const { readFileSync: read, writeFileSync: write } = require('fs');
const { resolve } = require('path');

const webpack = require('webpack');
const WebSocket = require('ws');

const client = require('../lib');

const logLevel = 'silent';
const options = { logLevel };

describe('watch', () => {
  const appPath = resolve(__dirname, 'fixtures/app.js');
  const clean = read(appPath, 'utf-8');

  test('invalidate', (done) => {
    const config = require('./fixtures/webpack.config-watch.js');
    const compiler = webpack(config);
    const { server } = client(compiler, options);
    let watcher;
    let dirty = false;

    server.on('listening', () => {
      const { host, port } = server;
      const socket = new WebSocket(`ws://${host}:${port}`);

      socket.on('message', (raw) => {
        const data = JSON.parse(raw);

        if (data.type === 'invalid') {
          watcher.close(() => {
            write(appPath, clean, 'utf-8');
            server.close(done);
          });
        }

        if (data.type === 'ok' && !dirty) {
          setTimeout(() => {
            dirty = true;
            write(appPath, `${clean}\nconsole.log('dirty');`, 'utf-8');
          }, 500);
        }
      });

      socket.on('open', () => {
        watcher = compiler.watch({}, () => {});
      });
    });
  });
});

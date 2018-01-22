'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const MemoryFileSystem = require('memory-fs');
const touch = require('touch');
const webpack = require('webpack');
const WebSocket = require('ws');
const hotClient = require('../../index');
const config = require('../fixtures/webpack.config.js');

describe('Sockets', function d() {
  const entryPath = path.join(__dirname, '../fixtures/app.js');
  const og = fs.readFileSync(entryPath, 'utf-8');

  this.timeout(30000);

  let compiler;
  let client;
  let watchers;

  before((done) => {
    compiler = webpack(config);
    client = hotClient(compiler, { hot: true, logLevel: 'silent' });

    const isMemoryFs = !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;

    if (!isMemoryFs) {
      compiler.outputFileSystem = new MemoryFileSystem();
    }

    watchers = compiler.watch({}, (err) => {
      if (err) {
        context.log.error(err.stack || err);
        if (err.details) {
          context.log.error(err.details);
        }
      }
    });

    setTimeout(done, 1000);
  });

  after((done) => {
    setTimeout(() => {
      watchers.close(() => {
        client.close(done);
      });
    }, 1000);
  });

  it('should setup and return wss', () => {
    const { wss } = client;

    assert(wss);
    assert(wss.broadcast);
  });

  it('should allow a child socket', (done) => {
    const socket = new WebSocket('ws://localhost:8081');

    assert(socket);

    socket.on('open', () => {
      assert(true);
      socket.close();
      done();
    });
  });

  it('sockets should receive messages', (done) => {
    const messages = [
      'compile',
      'hash',
      'invalid',
      'ok'
    ];

    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = JSON.parse(data);

      if (messages.includes(message.type)) {
        if (message.type === 'hash') {
          assert(message.data);
        }

        const index = messages.indexOf(message.type);
        if (index >= 0) {
          messages.splice(index, 1);
        }
      } else {
        throw new Error(`Unknown Message Type: ${message.type}`);
      }

      if (!messages.length) {
        socket.close();
        done();
      }
    });

    touch(entryPath);
  }).timeout(10000);

  // TODO: need some code here that'll actually generate an error
  it('sockets should receive warnings', (done) => {
    // eslint-disable-next-line
    const warningCode = '\nconsole.log(require)';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'warnings') {
        assert(message.data);
        assert(message.data.length);

        fs.writeFileSync(entryPath, og, 'utf-8');
        socket.close();
        done();
      }
    });

    fs.writeFileSync(entryPath, og + warningCode, 'utf-8');
  }).timeout(10000);

  it('sockets should receive errors', (done) => {
    const errorCode = '\nif(!window) { require("test"); }';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'errors') {
        assert(message.data);
        assert(message.data.length);

        fs.writeFileSync(entryPath, og, 'utf-8');
        socket.close();
        done();
      }
    });

    fs.writeFileSync(entryPath, og + errorCode, 'utf-8');
  }).timeout(10000);
});

'use strict';

/* eslint no-console: off */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const MemoryFileSystem = require('memory-fs');
const touch = require('touch');
const webpack = require('webpack');
const WebSocket = require('ws');
const webpackPackage = require('webpack/package.json');
const hotClient = require('../../index');
const config = require('../fixtures/webpack.config.js');

describe('Sockets', function d() {
  const entryPath = path.join(__dirname, '../fixtures/app.js');
  const og = fs.readFileSync(entryPath, 'utf-8');
  const webpackVersion = parseInt(webpackPackage.version, 10);

  if (webpackVersion > 3) {
    config.mode = 'development';
  }

  this.timeout(30000);

  let compiler;
  let client;
  let watchers;

  function parse(...args) {
    try {
      return JSON.parse(...args);
    } catch (e) {
      console.log(e);
    }
  }

  before((done) => {
    compiler = webpack(config);
    client = hotClient(compiler, { hot: true, logLevel: 'silent' });

    const isMemoryFs = !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;

    if (!isMemoryFs) {
      compiler.outputFileSystem = new MemoryFileSystem();
    }

    watchers = compiler.watch({}, (err) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
      }
    });

    setTimeout(done, 1000);
  });

  beforeEach(() => {
    fs.writeFileSync(entryPath, og, 'utf-8');
  });

  after(function after(done) {
    this.timeout(5000);
    setTimeout(() => {
      watchers.close(() => {
        client.close(done);
      });
    }, 4000);
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
    const valid = [
      'compile',
      'hash',
      'invalid',
      'ok'
    ];
    const received = [].concat(valid);
    const socket = new WebSocket('ws://localhost:8081');

    valid.push('warnings');

    socket.on('message', (data) => {
      const message = parse(data);

      // travis running on trusty doesn't recognize touching a file as
      // invalidating it, so it means the same thing here.
      if (message.type === 'no-change') {
        message.type = 'invalid';
      }

      if (valid.includes(message.type)) {
        if (message.type === 'hash') {
          assert(message.data);
        }

        const index = received.indexOf(message.type);
        if (index >= 0) {
          received.splice(index, 1);
        }
      } else {
        throw new Error(`Unknown Message Type: ${message.type}`);
      }

      if (!received.length) {
        socket.close();
        done();
      }
    });

    touch(entryPath);
  }).timeout(10000);

  it('sockets should receive warnings on change', (done) => {
    // eslint-disable-next-line
    const warningCode = '\nconsole.log(require)';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = parse(data);

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

  it('sockets should receive errors on change', (done) => {
    const errorCode = '\nif(!window) { require("test"); }';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = parse(data);

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

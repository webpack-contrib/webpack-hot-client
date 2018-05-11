'use strict';

/* eslint no-console: off */

const fs = require('fs');
const path = require('path');
const ansiRegex = require('ansi-regex');
const MemoryFileSystem = require('memory-fs');
const webpack = require('webpack');
const WebSocket = require('ws');
const webpackPackage = require('webpack/package.json');
const hotClient = require('../../index');
const config = require('../fixtures/webpack.config.js');

const entryPath = path.join(__dirname, '../fixtures/app.js');
const cleanPath = path.join(__dirname, '../fixtures/app-clean.js');
const clean = fs.readFileSync(cleanPath, 'utf-8');
const webpackVersion = parseInt(webpackPackage.version, 10);
const logLevel = 'silent';

if (webpackVersion > 3) {
  config.mode = 'development';
}

function parse(...args) {
  try {
    return JSON.parse(...args);
  } catch (e) {
    console.log(e);
  }
}

describe('Sockets', () => {
  let compiler;
  let client;
  let watchers;

  before((done) => {
    compiler = webpack(config);
    client = hotClient(compiler, { hot: true, logLevel });

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

  afterEach(() => {
    fs.writeFileSync(entryPath, clean, 'utf-8');
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

    expect(wss).toBeDefined();
    expect(wss.broadcast).toBeDefined();
  });

  it('should allow a child socket', (done) => {
    const socket = new WebSocket('ws://localhost:8081');

    expect(socket).toBeDefined();

    socket.on('open', () => {
      expect(true);
      socket.close();
      done();
    });
  });

  it('should broadcast to child sockets', (done) => {
    const socket = new WebSocket('ws://localhost:8081');
    const socket2 = new WebSocket('ws://localhost:8081');
    let isDone = false;

    expect(socket).toBeDefined();

    socket.on('open', () => {
      socket2.on('open', () => {
        socket.on('message', (data) => {
          const message = JSON.parse(data);

          if (!isDone) {
            expect(message).toBe('test');
            socket.close();
            socket2.close();

            isDone = true;
            done();
          }
        });

        socket2.send(JSON.stringify({
          type: 'broadcast',
          data: 'test'
        }));
      });
    });
  });

  it('sockets should receive warnings on change', (done) => {
    // eslint-disable-next-line
    const warningCode = '\nconsole.log(require)';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = parse(data);

      if (message.type === 'warnings') {
        const { warnings } = message.data;
        expect(warnings).toBeDefined();
        expect(warnings.length).toBeGreaterThan(0);

        for (const warning of warnings) {
          expect(ansiRegex().test(warning)).toBe(false);
        }

        socket.close();
        done();
      }
    });

    fs.writeFileSync(entryPath, clean + warningCode, 'utf-8');
  }).timeout(10000);

  it('sockets should receive errors on change', (done) => {
    const errorCode = '\nif(!window) { require("test"); }';
    const socket = new WebSocket('ws://localhost:8081');

    socket.on('message', (data) => {
      const message = parse(data);

      if (message.type === 'errors') {
        const { errors } = message.data;
        expect(errors).toBeDefined();
        expect(errors.length).toBeGreaterThan(0);

        for (const error of errors) {
          expect(ansiRegex().test(error)).toBe(false);
        }

        socket.close();
        done();
      }
    });

    fs.writeFileSync(entryPath, clean + errorCode, 'utf-8');
  }).timeout(10000);
});

describe('Sockets: send option', () => {
  let compiler;
  let client;
  let watchers;

  before((done) => {
    compiler = webpack(config);
    client = hotClient(compiler, {
      hot: true,
      logLevel,
      send: { errors: false, warnings: false }
    });

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

  afterEach(() => {
    fs.writeFileSync(entryPath, clean, 'utf-8');
  });

  after(function after(done) {
    this.timeout(5000);
    setTimeout(() => {
      watchers.close(() => {
        client.close(done);
      });
    }, 4000);
  });

  it('sockets should not receive warnings', (done) => {
    const warningCode = '\nconsole.log(require)';
    const socket = new WebSocket('ws://localhost:8081');
    let received = false;

    socket.on('message', (data) => {
      const message = parse(data);

      if (message.type === 'warnings') {
        received = true;
      }
    });

    setTimeout(() => {
      expect(received).toBe(false);
      done();
    }, 1000);

    fs.writeFileSync(entryPath, clean + warningCode, 'utf-8');
  }).timeout(10000);

  it('sockets should not receive errors', (done) => {
    const errorCode = '\nif(!window) { require("test"); }';
    const socket = new WebSocket('ws://localhost:8081');
    let received = false;

    socket.on('message', (data) => {
      const message = parse(data);

      if (message.type === 'errors') {
        received = true;
      }
    });

    setTimeout(() => {
      expect(received).toBe(false);
      done();
    }, 1000);

    fs.writeFileSync(entryPath, clean + errorCode, 'utf-8');
  }).timeout(10000);
});

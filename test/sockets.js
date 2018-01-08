'use strict';

/* global window */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const touch = require('touch');
const WebSocket = require('ws');
const client = require('../index');
const setup = require('./setup.js');

describe('Webpack Hot Client', () => {
  const entryPath = path.join(__dirname, 'fixtures/app.js');
  const og = fs.readFileSync(entryPath, 'utf-8');
  let socket;

  after(() => {
    fs.writeFileSync(entryPath, og, 'utf-8');
  });

  it('should exist', () => {
    assert(client);
  });

  it('should setup and return wss', () => {
    const result = setup();
    const { wss } = result.client;

    assert(wss);
    assert(wss.broadcast);
  });

  it('should allow a child socket', (done) => {
    socket = new WebSocket('ws://localhost:8081');

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

    socket = new WebSocket('ws://localhost:8081');

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

    socket = new WebSocket('ws://localhost:8081');

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

    socket = new WebSocket('ws://localhost:8081');

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

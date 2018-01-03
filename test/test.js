'use strict';

const assert = require('assert');
const WebSocket = require('ws');
const client = require('../index');
const setup = require('./setup.js');

describe('Webpack HMR Client', () => {
  let socket;

  it('should exist', () => {
    assert(client);
  });

  it('should setup and return wss', () => {
    const { wss } = setup();

    assert(wss);
    assert(wss.broadcast);
  });

  it('should allow a child socket', (done) => {
    socket = new WebSocket('ws://localhost:8081');

    assert(socket);

    socket.on('open', () => {
      assert(true);
      done();
    });
  });

  it('sockets should receive messages', (done) => {
    socket.on('message', (data) => {

    });
  });
});

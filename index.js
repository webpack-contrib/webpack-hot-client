'use strict';

const weblog = require('webpack-log');
const WebSocket = require('ws');
const { modifyCompiler, payload, sendStats, validateEntry } = require('./lib/util');

const defaults = {
  host: 'localhost',
  hot: true,
  https: false,
  logLevel: 'info',
  logTime: false,
  port: 8081,
  reload: true,
  server: null,
  stats: {
    context: process.cwd()
  },
  test: false
};
const log = weblog({ name: 'hot', id: 'webpack-hot-client' });
const timefix = 11000;

module.exports = (compiler, opts) => {
  const options = Object.assign({}, defaults, opts);

  validateEntry(compiler);

  const { host, port, server } = options;
  const wss = new WebSocket.Server(options.server ? { server } : { host, port });
  let stats;

  if (options.server) {
    const addr = options.server.address();
    log.info(`WebSocket Server Attached to ${addr.address}:${addr.port}`);
  }

  function broadcast(data) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  wss.broadcast = broadcast;

  if (options.server) {
    options.webSocket = {
      host: wss._server.address().address, // eslint-disable-line no-underscore-dangle
      port: wss._server.address().port // eslint-disable-line no-underscore-dangle
    };
  } else {
    options.webSocket = { host, port };
  }

  log.level = options.logLevel;

  modifyCompiler(compiler, options);

  compiler.plugin('compile', () => {
    stats = null;
    log.info('webpack: Compiling...');
    broadcast(payload('compile'));
  });

  compiler.plugin('invalid', () => {
    log.info('webpack: Bundle Invalidated');
    broadcast(payload('invalid'));
  });

  compiler.plugin('done', (result) => {
    log.info('webpack: Compiling Done');
    // apply a fix for compiler.watch as outline here: ff0000-ad-tech/wp-plugin-watch-offset
    result.startTime -= timefix; // eslint-disable-line no-param-reassign
    stats = result;
    sendStats(broadcast, stats.toJson(options.stats));
  });

  compiler.plugin('watch-run', (watching, callback) => {
    watching.startTime += timefix; // eslint-disable-line no-param-reassign
    callback();
  });

  wss.on('error', (err) => {
    log.error('WebSocket Server Error', err);
  });

  wss.on('listening', () => {
    // eslint-disable-next-line no-shadow
    const { host, port } = options.webSocket;
    log.info(`WebSocket Server Listening at ${host}:${port}`);
  });

  wss.on('connection', (socket) => {
    log.info('WebSocket Client Connected');

    socket.on('error', (err) => {
      if (err.errno !== 'ECONNRESET') {
        log.warn('client socket error', JSON.stringify(err));
      }
    });

    if (stats) {
      sendStats(broadcast, stats.toJson(options.stats));
    }
  });

  return {
    close(callback) {
      try {
        wss.close(callback);
      } catch (err) {
        log.error(err);
      }
    },

    wss
  };
};

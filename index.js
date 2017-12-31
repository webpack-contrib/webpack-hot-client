'use strict';

const weblog = require('webpack-log');
const webpack = require('webpack');
const WebSocket = require('ws');

const defaults = {
  https: false,
  logLevel: 'info',
  logTime: false,
  port: 8080,
  reload: true,
  server: null,
  stats: {
    context: process.cwd()
  }
};
const log = weblog({ name: 'hmr', id: 'webpack-hmr-client' });

function payload(type, data) {
  return JSON.stringify({ type, data });
}

function sendStats(socket, stats) {
  const send = (type, data) => {
    if (socket) {
      socket.send(payload(type, data));
    }
  };

  if (!stats) {
    log.error('sendStats: stats is undefined');
  }

  if (stats.errors && stats.errors.length > 0) {
    send('errors', stats.errors);
    return;
  }

  if (stats.assets && stats.assets.every(asset => !asset.emitted)) {
    return;
  }

  send('hash', stats.hash);

  if (stats.warnings.length > 0) {
    send('warnings', stats.warnings);
  } else {
    send('ok');
  }
}

module.exports = (compiler, opts) => {
  const options = Object.assign({}, defaults, opts);
  const { port, server } = options;
  const wss = new WebSocket.Server(options.server ? { server } : { port });

  let socket;
  let stats;

  log.level = options.logLevel;

  // this is how we pass the options at runtime to the client script
  const definePlugin = new webpack.DefinePlugin({
    __hmrClientOptions__: JSON.stringify(options)
  });

  for (const comp of [].concat(compiler.compilers || compiler)) {
    log.debug('Applying DefinePlugin:__hmrClientOptions__');
    comp.apply(definePlugin);
  }

  wss.on('error', (err) => {
    log.error('WebSocket Server Error', err);
  });

  wss.on('listening', () => {
    log.info('WebSocket Server Attached and Listening');
  });

  wss.on('connection', (ws) => {
    socket = ws;
    const og = socket.send;

    socket.send = function send(...args) {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }

      const cb = function cb(error) {
        // we'll occasionally get an Error('not open'); here
        if (error) {
          // wait a half second and try again
          setTimeout(() => {
            log.debug('socket.send: retrying:', args);
            og.apply(socket, args);
          }, 500);
        }
      };

      args.push(cb);
      og.apply(socket, args);
      log.debug('socket.send:', args);
    };

    compiler.plugin('compile', () => {
      stats = null;
      log.info('webpack: Compiling...');
    });

    compiler.plugin('invalid', () => {
      socket.send(payload('invalid'));
    });

    compiler.plugin('done', (result) => {
      stats = result;
      sendStats(socket, stats.toJson(options.stats));
    });

    if (stats) {
      sendStats(socket, stats.toJson(options.stats));
    }
  });
};

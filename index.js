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
const timefix = 11000;

module.exports = (compiler, opts) => {
  const options = Object.assign({}, defaults, opts);
  const log = weblog({
    name: 'hot',
    id: 'webpack-hot-client',
    level: options.logLevel,
    timestamp: options.logTime
  });

  validateEntry(compiler);

  const { host, port, server } = options;
  const wss = new WebSocket.Server(options.server ? { server } : { host, port });
  let stats;

  options.log = log;

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

  modifyCompiler(compiler, options);

  const compile = () => {
    stats = null;
    log.info('webpack: Compiling...');
    broadcast(payload('compile'));
  };

  const done = (result) => {
    log.info('webpack: Compiling Done');
    // apply a fix for compiler.watch as outline here: ff0000-ad-tech/wp-plugin-watch-offset
    result.startTime -= timefix; // eslint-disable-line no-param-reassign
    stats = result;

    const jsonStats = stats.toJson(options.stats);

    if (!jsonStats) {
      options.log.error('compiler done: `stats` is undefined');
    }

    sendStats(broadcast, jsonStats);
  };

  const invalid = () => {
    log.info('webpack: Bundle Invalidated');
    broadcast(payload('invalid'));
  };

  const watchRun = (watching, callback) => {
    watching.startTime += timefix; // eslint-disable-line no-param-reassign
    // webpack@4 doesn't send a callback function as an argument
    if (callback) {
      callback();
    }
  };

  if (compiler.hooks) {
    // as of webpack@4 MultiCompiler no longer exports the compile hook
    const compilers = compiler.compilers || [compiler];
    for (const comp of compilers) {
      comp.hooks.compile.tap('WebpackHotClient', compile);
      // when using a MultieCompiler, this can be a MultiHook, which behaves
      // very strangely.
      compiler.hooks.watchRun.tap('WebpackHotClient', watchRun);
    }
    compiler.hooks.invalid.tap('WebpackHotClient', invalid);
    compiler.hooks.done.tap('WebpackHotClient', done);
  } else {
    compiler.plugin('compile', compile);
    compiler.plugin('invalid', invalid);
    compiler.plugin('done', done);
    compiler.plugin('watch-run', watchRun);
  }


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
      const jsonStats = stats.toJson(options.stats);

      if (!jsonStats) {
        options.log.error('Client Connection: `stats` is undefined');
      }

      sendStats(broadcast, jsonStats);
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

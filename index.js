'use strict';

const weblog = require('webpack-log');
const webpack = require('webpack');
const EntryOptionPlugin = require('webpack/lib/EntryOptionPlugin');
const ParserHelpers = require('webpack/lib/ParserHelpers');
const { version } = require('webpack/package.json');
const WebSocket = require('ws');
const HotEntryPlugin = require('./HotClientEntryPlugin');
const { payload, sendStats } = require('./lib/util');

// this is super hacky, but it's all we've got for now.
// there just isn't any other way to automagically add entries to the config
// before Webpack's constructor has it's way with them.
EntryOptionPlugin.prototype.apply = HotEntryPlugin.prototype.apply;
EntryOptionPlugin.prototype.toPlugin = HotEntryPlugin.prototype.toPlugin;

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

module.exports = (compiler, opts) => {
  const options = Object.assign({}, defaults, opts);
  const { host, port, server } = options;
  const wss = new WebSocket.Server(options.server ? { server } : { host, port });
  let stats;

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

  // this is how we pass the options at runtime to the client script
  const definePlugin = new webpack.DefinePlugin({
    __hotClientOptions__: JSON.stringify(options)
  });

  for (const comp of [].concat(compiler.compilers || compiler)) {
    const hmrPlugin = new webpack.HotModuleReplacementPlugin();

    log.debug('Applying DefinePlugin:__hotClientOptions__');
    definePlugin.apply(comp);

    // fix is only available for webpack@4
    if (parseInt(version.substring(0, 1), 10) > 3) {
      comp.hooks.compilation.tap('HotModuleReplacementPlugin', (compilation, {
        normalModuleFactory
      }) => {
        const handler = (parser) => {
          parser.hooks.evaluateIdentifier.for('module.hot').tap({
            name: 'HotModuleReplacementPlugin',
            before: 'NodeStuffPlugin'
          }, expr => ParserHelpers.evaluateToIdentifier('module.hot', !!parser.state.compilation.hotUpdateChunkTemplate)(expr));
        };

        normalModuleFactory.hooks.parser.for('javascript/auto').tap('HotModuleReplacementPlugin', handler);
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap('HotModuleReplacementPlugin', handler);
      });

      hmrPlugin.apply(comp);
    } else {
      // must come first
      hmrPlugin.apply(comp);

      compiler.plugin('compilation', (compilation, data) => {
        data.normalModuleFactory.plugin('parser', (parser) => {
          // eslint-disable-next-line no-underscore-dangle
          parser._plugins['evaluate Identifier module.hot'].reverse();
        });
      });
    }
  }

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
    stats = result;
    sendStats(broadcast, stats.toJson(options.stats));
  });

  wss.on('error', (err) => {
    log.error('WebSocket Server Error', err);
  });

  wss.on('listening', () => {
    log.info('WebSocket Server Attached and Listening');
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
      wss.close(callback);
    },

    wss
  };
};

const { Server: HttpsServer } = require('https');

const validate = require('@webpack-contrib/schema-utils');
const merge = require('merge-options').bind({ concatArrays: true });
const weblog = require('webpack-log');

const schema = require('../schemas/options.json');

const HotClientError = require('./HotClientError');

const defaults = {
  allEntries: false,
  autoConfigure: true,
  host: 'localhost',
  hmr: true,
  // eslint-disable-next-line no-undefined
  https: undefined,
  logLevel: 'info',
  logTime: false,
  port: 0,
  reload: true,
  send: {
    errors: true,
    warnings: true,
  },
  server: null,
  client: {},
  stats: {
    context: process.cwd(),
  },
  validTargets: ['web'],
  test: false,
};

module.exports = (opts = {}) => {
  validate({ name: 'webpack-hot-client', schema, target: opts });

  const options = merge({}, defaults, opts);
  const log = weblog({
    name: 'hot',
    id: options.test ? null : 'webpack-hot-client',
    level: options.logLevel,
    timestamp: options.logTime,
  });

  options.log = log;

  if (typeof options.host === 'string') {
    options.host = {
      server: options.host,
      client: options.host,
    };
  } else if (!options.host.server) {
    throw new HotClientError(
      '`host.server` must be defined when setting host to an Object'
    );
  } else if (!options.host.client) {
    throw new HotClientError(
      '`host.client` must be defined when setting host to an Object'
    );
  }

  const { server, client } = options;
  const hasServer = server && server.listening;
  options.webSocketServer = {};

  if (hasServer && server instanceof HttpsServer && typeof options.https === 'undefined') {
    options.https = true;
  }

  if (hasServer) {
    options.webSocketServer = { server };
  } else {
    options.webSocketServer = {
        host: server && server.host || options.host.server,
        port: server && server.port || options.port,
    }
  }

  options.webSocketClient = {
    host: client.host || options.host.client || (hasServer && server.address().address) || '*',
    port: client.port || (hasServer && server.address().port) || options.port,
    secure: typeof client.secure !== 'undefined' ? client.secure : options.https,
  };

  return options;
};

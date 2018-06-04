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
  https: false,
  logLevel: 'info',
  logTime: false,
  port: 0,
  reload: true,
  send: {
    errors: true,
    warnings: true,
  },
  server: null,
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

  const { server } = options;

  if (server && !server.listening) {
    throw new HotClientError(
      '`options.server` must be a running/listening http.Server instance'
    );
  } else if (server) {
    options.webSocket = {
      host: server.address().address,
      port: server.address().port,
    };
  } else {
    options.webSocket = { host: options.host.client, port: options.port };
  }

  return options;
};

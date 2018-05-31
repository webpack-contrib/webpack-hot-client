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
  port: 8081,
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
};

module.exports = (opts) => {
  validate({ name: 'webpack-hot-client', schema, target: opts });

  const options = merge({}, defaults, opts);
  const log = weblog({
    name: 'hot',
    id: 'webpack-hot-client',
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
      '`options.server` must be defined when setting host to an Object'
    );
  } else if (!options.host.client) {
    throw new HotClientError(
      '`options.client` must be defined when setting host to an Object'
    );
  }

  // TODO: remove `hot` as a valid option in 4.0.0
  /* istanbul ignore if */
  if (typeof options.hot !== 'undefined') {
    options.hmr = options.hot;
    process.emitWarning(
      'webpack-hot-client: The `hot` option is deprecated and will be removed in v4.0.0. Please use the `hmr` option.'
    );
  }

  const { server } = options;

  if (server) {
    options.webSocket = {
      host: server.address().address,
      port: server.address().port,
    };
  } else {
    options.webSocket = { host: options.host.client, port: options.port };
  }

  return options;
};

'use strict';

const uuid = require('uuid/v4');
const weblog = require('webpack-log');

const log = weblog({ name: 'hot', id: 'webpack-hot-client' });

module.exports = {

  addEntry(comp, options) {
    const configs = [].concat(comp.options);
    const script = options.test ? '../../client' : 'webpack-hot-client/client';

    log.info('Adding \'webpack-hot-client/client\' to compiler entries');

    for (const conf of configs) {
      // when defining multiple compilers, each compiler config needs to define
      // a `name`. otherwise the hot-middleware can get confused.
      // https://github.com/glenjamin/webpack-hot-middleware#multi-compiler-mode
      if (!conf.name) {
        conf.name = uuid();
      }

      const { name } = conf;
      const hotEntry = [`${script}?${name}`];

      if (typeof conf.entry === 'object' && !Array.isArray(conf.entry)) {
        for (const key of Object.keys(conf.entry)) {
          conf.entry[key] = hotEntry.concat(conf.entry[key]);
        }
      } else if (typeof conf.entry === 'function') {
        conf.entry = conf.entry(hotEntry);
      } else {
        conf.entry = hotEntry.concat(conf.entry);
      }
    }
  },

  addRule(comp) {
    const configs = [].concat(comp.options);
    const rule = {
      test: /\/client\/.*\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {
              targets: {
                browsers: ['last 2 versions']
              }
            }]
          ]
        }
      }
    };

    for (const conf of configs) {
      if (!conf.module) {
        conf.module = { rules: [rule] };
      } else if (!conf.module.rules) {
        conf.module.rules = [rule];
      } else {
        conf.module.rules.push(rule);
      }
    }
  },

  payload(type, data) {
    return JSON.stringify({ type, data });
  },

  sendStats(broadcast, stats) {
    const send = (type, data) => {
      broadcast(module.exports.payload(type, data));
    };

    if (!stats) {
      log.error('sendStats: stats is undefined');
    }

    if (stats.errors && stats.errors.length > 0) {
      send('errors', stats.errors);
      return;
    }

    if (stats.assets && stats.assets.every(asset => !asset.emitted)) {
      send('no-change');
      return;
    }

    send('hash', stats.hash);

    if (stats.warnings.length > 0) {
      send('warnings', stats.warnings);
    } else {
      send('ok');
    }
  }
};

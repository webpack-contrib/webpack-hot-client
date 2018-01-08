'use strict';

const weblog = require('webpack-log');

const log = weblog({ name: 'hot', id: 'webpack-hot-client' });

module.exports = {

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

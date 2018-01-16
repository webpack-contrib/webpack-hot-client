'use strict';

const weblog = require('webpack-log');

const log = weblog({ name: 'hot', id: 'webpack-hot-client' });

module.exports = {

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

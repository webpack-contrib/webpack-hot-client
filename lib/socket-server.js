const stringify = require('json-stringify-safe');
const strip = require('strip-ansi');
const WebSocket = require('ws');

/* eslint-disable no-param-reassign */

function payload(type, data) {
  return stringify({ type, data });
}

module.exports = (options) => {
  const { host, log, port, server } = options;
  const wssOptions = options.server ? { server } : { host: host.server, port };
  const wss = new WebSocket.Server(wssOptions);

  if (options.server) {
    const addr = options.server.address();
    log.info(`WebSocket Server Attached to ${addr.address}:${addr.port}`);
  }

  wss.broadcast = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  wss.sendData = (stats) => {
    const send = (type, data) => {
      wss.broadcast(payload(type, data));
    };

    if (stats.errors && stats.errors.length > 0) {
      if (options.send.errors) {
        const errors = [].concat(stats.errors).map((error) => strip(error));
        send('errors', { errors });
      }
      return;
    }

    /* istanbul ignore if */
    if (stats.assets && stats.assets.every((asset) => !asset.emitted)) {
      send('no-change');
      return;
    }

    const { hash, warnings } = stats;

    send('hash', { hash });

    if (warnings.length > 0) {
      if (options.send.warnings) {
        send('warnings', { warnings });
      }
    } else {
      send('ok');
    }
  };

  wss.on('error', (err) => {
    /* istanbul ignore next */
    log.error('WebSocket Server Error', err);
  });

  wss.on('listening', () => {
    // eslint-disable-next-line no-shadow
    const { host, port } = options;
    log.info(`WebSocket Server Listening at ${host.server}:${port}`);
  });

  wss.on('connection', (socket) => {
    log.info('WebSocket Client Connected');

    socket.on('error', (err) => {
      /* istanbul ignore next */
      if (err.errno !== 'ECONNRESET') {
        log.warn('client socket error', JSON.stringify(err));
      }
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'broadcast') {
        for (const client of wss.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(stringify(message.data));
          }
        }
      }
    });

    // only send stats to newly connected clients if no previous clients have
    // connected
    if (options.stats && !wss.clients.length) {
      const jsonStats = options.stats.toJson(options.stats);

      /* istanbul ignore if */
      if (!jsonStats) {
        options.log.error('Client Connection: `stats` is undefined');
      }

      wss.sendData(jsonStats, options);
    }
  });

  return {
    broadcast: wss.broadcast,
    close(callback) {
      try {
        wss.close(callback);
      } catch (err) {
        /* istanbul ignore next */
        log.error(err);
      }
    },
    payload,
    sendData: wss.sendData,
    server: wss,
  };
};

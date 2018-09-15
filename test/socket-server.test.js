const http = require('http');

const WebSocket = require('ws');

const { getServer, payload } = require('../lib/socket-server');
const getOptions = require('../lib/options');

const options = getOptions({ logLevel: 'silent' });

const createServer = (port, host, callback) =>
  new Promise((resolve) => {
    const server = http.createServer();
    server.on('close', () => {
      resolve();
    });
    server.listen(port, host, callback.bind(null, server));
  });

const getSocket = (port, host) => new WebSocket(`ws://${host}:${port}`);

describe('socket server', () => {
  test('getServer', (done) => {
    const server = getServer(options);
    const { broadcast, close, send } = server;

    expect(broadcast).toBeDefined();
    expect(close).toBeDefined();
    expect(send).toBeDefined();

    server.on('listening', () => {
      const { host, port } = server;
      expect(host).toBe('127.0.0.1');
      expect(port).toBeGreaterThan(0);

      close(done);
    });
  });

  test('getServer: { server }', () =>
    createServer(1337, '127.0.0.1', (server) => {
      const opts = getOptions({ server });
      const { close, host, port } = getServer(opts);

      expect(host).toBe('127.0.0.1');
      expect(port).toBe(1337);

      server.close(close);
    }));

  test('payload', () => {
    expect(payload('test', { batman: 'superman ' })).toMatchSnapshot();
  });

  test('broadcast', (done) => {
    const server = getServer(options);
    const { broadcast, close } = server;

    server.on('listening', () => {
      const { host, port } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (data) => {
        expect(data).toMatchSnapshot();
        close(done);
      });

      catcher.on('open', () => {
        broadcast(payload('broadcast', { received: true }));
      });
    });
  });

  test('socket broadcast', (done) => {
    const server = getServer(options);
    const { close } = server;

    server.on('listening', () => {
      const { host, port } = server;
      const pitcher = getSocket(port, host);
      const catcher = getSocket(port, host);

      catcher.on('message', (data) => {
        expect(data).toMatchSnapshot();
        close(done);
      });

      pitcher.on('open', () => {
        pitcher.send(payload('broadcast', { received: true }));
      });
    });
  });

  test('send via stats', (done) => {
    const lastJsonStats = {
      hash: '111111',
      warnings: [],
    };
    const opts = getOptions({ logLevel: 'silent' });
    opts.lastJsonStats = lastJsonStats;
    const server = getServer(opts);
    const { close } = server;

    server.on('listening', () => {
      const { host, port } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (raw) => {
        const data = JSON.parse(raw);
        if (data.type === 'ok') {
          expect(data).toMatchSnapshot();
          close(done);
        }
      });
    });
  });

  test('errors', (done) => {
    const server = getServer(options);
    const { close } = server;

    server.on('listening', () => {
      const { host, port, send } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (raw) => {
        const data = JSON.parse(raw);
        if (data.type === 'errors') {
          expect(data).toMatchSnapshot();
          close(done);
        }
      });

      catcher.on('open', () => {
        send({
          errors: ['test error'],
        });
      });
    });
  });

  test('hash-ok', (done) => {
    const server = getServer(options);
    const { close } = server;

    server.on('listening', () => {
      const { host, port, send } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (raw) => {
        const data = JSON.parse(raw);
        if (data.type === 'ok') {
          expect(data).toMatchSnapshot();
          close(done);
        }
      });

      catcher.on('open', () => {
        send({
          hash: '000000',
          warnings: [],
        });
      });
    });
  });

  test('no-change', (done) => {
    const server = getServer(options);
    const { close } = server;

    server.on('listening', () => {
      const { host, port, send } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (data) => {
        expect(data).toMatchSnapshot();
        close(done);
      });

      catcher.on('open', () => {
        send({
          assets: [{ emitted: false }],
        });
      });
    });
  });

  test('hash-ok', (done) => {
    const server = getServer(options);
    const { close } = server;

    server.on('listening', () => {
      const { host, port, send } = server;
      const catcher = getSocket(port, host);

      catcher.on('message', (raw) => {
        const data = JSON.parse(raw);
        if (data.type === 'warnings') {
          expect(data).toMatchSnapshot();
          close(done);
        }
      });

      catcher.on('open', () => {
        send({
          hash: '000000',
          warnings: ['test warning'],
        });
      });
    });
  });
});

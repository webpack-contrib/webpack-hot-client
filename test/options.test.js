const { readFileSync: read } = require('fs');
const { resolve } = require('path');
const https = require('https');

const killable = require('killable');

const getOptions = require('../lib/options');

describe('options', () => {
  test('defaults', () => {
    const options = getOptions();
    expect(options).toMatchSnapshot({
      stats: {
        context: expect.stringMatching(/(webpack-hot-client|project)$/),
      },
    });
  });

  test('altered options', () => {
    const altered = {
      allEntries: true,
      autoConfigure: false,
      host: {
        client: 'localhost',
        server: 'localhost',
      },
      hmr: false,
      https: true,
      logLevel: 'trace',
      logTime: true,
      port: 0,
      reload: false,
      send: {
        errors: false,
        warnings: false,
      },
      // this property is tested later
      // server: null,
      stats: {
        context: '/',
      },
      validTargets: ['batman'],
      // we pass this to force the log instance to be unique, to assert log
      // option differences
      test: true,
    };
    const options = getOptions(altered);
    // console.log(JSON.stringify(options, null, 2));
    expect(options).toMatchSnapshot();
  });

  test('https.Server', (done) => {
    const passphrase = 'sample';
    const pfx = read(resolve(__dirname, './fixtures/test-cert.pfx'));
    const server = https.createServer({ passphrase, pfx });

    killable(server);
    server.listen(0, () => {
      const options = getOptions({ server });
      expect(options).toMatchSnapshot({
        server: expect.any(https.Server),
        webSocket: {
          host: '::',
          port: expect.any(Number),
        },
      });
      server.kill(done);
    });
  });

  test('https: false, https.Server', (done) => {
    const passphrase = 'sample';
    const pfx = read(resolve(__dirname, './fixtures/test-cert.pfx'));
    const server = https.createServer({ passphrase, pfx });

    killable(server);
    server.listen(0, () => {
      const options = getOptions({ server, https: false });
      expect(options).toMatchSnapshot({
        server: expect.any(https.Server),
        webSocket: {
          host: '::',
          port: expect.any(Number),
        },
      });
      server.kill(done);
    });
  });

  test('throws on invalid options', () => {
    const t = () => getOptions({ host: true });
    expect(t).toThrow();
  });

  test('throws if host.client is missing', () => {
    const t = () => getOptions({ host: { server: 'localhost' } });
    expect(t).toThrow();
  });

  test('throws if host.server is missing', () => {
    const t = () => getOptions({ host: { client: 'localhost' } });
    expect(t).toThrow();
  });
});

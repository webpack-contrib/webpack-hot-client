const { createServer } = require('http');

const getOptions = require('../lib/options');

describe('options', () => {
  test('defaults', () => {
    const options = getOptions({});
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

  test('reject non-http.Server server', () => {
    const server = {};
    const t = () => getOptions({ server });
    expect(t).toThrow();
  });

  test('reject non-running server', () => {
    const server = createServer();
    const t = () => getOptions({ server });
    expect(t).toThrow();
  });
});

const getOptions = require('../lib/options');

describe('options', () => {
  test('defaults', () => {
    const options = getOptions({});
    expect(options).toMatchSnapshot({
      stats: {
        context: expect.stringMatching(/webpack-hot-client$/),
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
      server: {
        address: () => {
          return {};
        },
      },
      stats: {
        context: '/',
      },
      validTargets: ['batman'],
    };
    const options = getOptions(altered);
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

  test('deprecated hot property', () => {
    const options = getOptions({ hot: false });
    expect(options).toMatchSnapshot({
      stats: {
        context: expect.stringMatching(/webpack-hot-client$/),
      },
    });
  });
});

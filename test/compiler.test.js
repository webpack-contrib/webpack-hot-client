const webpack = require('webpack');

const {
  addEntry,
  hotEntry,
  modifyCompiler,
  validateCompiler,
  validateEntry,
} = require('../lib/compiler');
const HotClientError = require('../lib/HotClientError');
const getOptions = require('../lib/options');

const compilerName = 'test';
const options = getOptions({});

// eslint-disable-next-line import/no-dynamic-require, global-require
const getConfig = (name) => require(`./fixtures/webpack.config-${name}`);

describe('compiler', () => {
  test('validateEntry: array', () => {
    const result = validateEntry([]);
    expect(result).toBe(true);
  });

  test('validateEntry: object', () => {
    const result = validateEntry({ a: [], b: [] });
    expect(result).toBe(true);
  });

  test('validateEntry: string', () => {
    const t = () => validateEntry('');
    expect(t).toThrow();
  });

  test('validateEntry: object, string', () => {
    const t = () => validateEntry({ a: [], b: '' });
    expect(t).toThrow(TypeError);
  });

  test('validateCompiler: string', () => {
    const t = () => validateEntry('');
    expect(t).toThrow(TypeError);
  });

  test('validateCompiler', () => {
    const config = getConfig('array');
    const compiler = webpack(config);
    const result = validateCompiler(compiler);
    expect(result).toBe(true);
  });

  test('validateCompiler: HotModuleReplacementPlugin', () => {
    const config = getConfig('invalid-plugin');
    const compiler = webpack(config);
    const t = () => validateCompiler(compiler);
    expect(t).toThrow(HotClientError);
  });

  test('addEntry: array', () => {
    const entry = ['index.js'];
    const entries = addEntry(entry, compilerName, options);
    expect(entries).toMatchSnapshot();
  });

  test('addEntry: array', () => {
    const entry = ['index.js'];
    const entries = addEntry(entry, compilerName, options);
    expect(entries).toMatchSnapshot();
  });

  test('addEntry: array', () => {
    const entry = ['index.js'];
    const entries = addEntry(entry, compilerName, options);
    expect(entries).toMatchSnapshot();
  });

  test('addEntry: object', () => {
    const entry = {
      a: ['index-a.js'],
      b: ['index-b.js'],
    };
    const entries = addEntry(entry, compilerName, options);
    expect(entries).toMatchSnapshot();
  });

  test('addEntry: object, allEntries: true', () => {
    const entry = {
      a: ['index-a.js'],
      b: ['index-b.js'],
    };
    const opts = getOptions({ allEntries: true });
    const entries = addEntry(entry, compilerName, opts);
    expect(entries).toMatchSnapshot();
  });

  test('hotEntry: invalid target', () => {
    const config = getConfig('array');
    config.target = 'node';

    const compiler = webpack(config);
    const result = hotEntry(compiler, options);

    expect(result).toBe(false);
  });

  const configTypes = ['array', 'function', 'object'];

  for (const configType of configTypes) {
    test(`modifyCompiler: ${configType}`, () => {
      const config = getConfig(configType);
      const compiler = webpack(config);

      // at this time we don't have a meaningful way of inspecting which plugins
      // have been applied to the compiler, unfortunately. the best we can do is
      // perform the hotEntry and hotPlugin actions and pass if there's no
      // exceptions thrown.
      modifyCompiler(compiler, options);

      expect(true);
    });
  }
});

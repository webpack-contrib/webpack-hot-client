const ParserHelpers = require('webpack/lib/ParserHelpers');
const stringify = require('json-stringify-safe');
const uuid = require('uuid/v4');
const { DefinePlugin, HotModuleReplacementPlugin } = require('webpack');

const HotClientError = require('./HotClientError');

function addEntry(entry, compilerName, options) {
  const clientEntry = [`webpack-hot-client/client?${compilerName || uuid()}`];
  let newEntry = {};

  if (!Array.isArray(entry) && typeof entry === 'object') {
    const keys = Object.keys(entry);
    const [first] = keys;

    for (const entryName of keys) {
      if (options.allEntries) {
        newEntry[entryName] = clientEntry.concat(entry[entryName]);
      } else if (entryName === first) {
        newEntry[first] = clientEntry.concat(entry[first]);
      } else {
        newEntry[entryName] = entry[entryName];
      }
    }
  } else {
    newEntry = clientEntry.concat(entry);
  }

  return newEntry;
}

function hotEntry(compiler, options) {
  if (!options.validTargets.includes(compiler.options.target)) {
    return false;
  }

  const { entry } = compiler.options;
  const { name } = compiler;
  let newEntry;

  if (typeof entry === 'function') {
    /* istanbul ignore next */
    // TODO: run the build in tests and examine the output
    newEntry = function enter(...args) {
      // the entry result from the original entry function in the config
      let result = entry(...args);

      validateEntry(result);

      result = addEntry(result, name, options);

      return result;
    };
  } else {
    newEntry = addEntry(entry, name, options);
  }

  compiler.hooks.entryOption.call(compiler.options.context, newEntry);

  return true;
}

function hotPlugin(compiler) {
  const hmrPlugin = new HotModuleReplacementPlugin();

  /* istanbul ignore next */
  compiler.hooks.compilation.tap(
    'HotModuleReplacementPlugin',
    (compilation, { normalModuleFactory }) => {
      const handler = (parser) => {
        parser.hooks.evaluateIdentifier.for('module.hot').tap(
          {
            name: 'HotModuleReplacementPlugin',
            before: 'NodeStuffPlugin',
          },
          (expr) =>
            ParserHelpers.evaluateToIdentifier(
              'module.hot',
              !!parser.state.compilation.hotUpdateChunkTemplate
            )(expr)

        );
      };

      normalModuleFactory.hooks.parser
        .for('javascript/auto')
        .tap('HotModuleReplacementPlugin', handler);
      normalModuleFactory.hooks.parser
        .for('javascript/dynamic')
        .tap('HotModuleReplacementPlugin', handler);
    }
  );

  hmrPlugin.apply(compiler);
}

function validateEntry(entry) {
  const type = typeof entry;
  const isArray = Array.isArray(entry);

  if (type !== 'function') {
    if (!isArray && type !== 'object') {
      throw new TypeError(
        'webpack-hot-client: The value of `entry` must be an Array, Object, or Function. Please check your webpack config.'
      );
    }

    if (!isArray && type === 'object') {
      for (const key of Object.keys(entry)) {
        const value = entry[key];
        if (!Array.isArray(value)) {
          throw new TypeError(
            'webpack-hot-client: `entry` Object values must be an Array or Function. Please check your webpack config.'
          );
        }
      }
    }
  }

  return true;
}

module.exports = {
  addEntry,
  hotEntry,
  hotPlugin,
  validateEntry,

  modifyCompiler(compiler, options) {
    // this is how we pass the options at runtime to the client script
    const definePlugin = new DefinePlugin({
      __hotClientOptions__: stringify(options),
    });

    for (const comp of [].concat(compiler.compilers || compiler)) {
      if (options.autoConfigure) {
        hotEntry(comp, options);
        hotPlugin(comp);
      }

      options.log.debug('Applying DefinePlugin:__hotClientOptions__');
      definePlugin.apply(comp);
    }
  },

  validateCompiler(compiler) {
    for (const comp of [].concat(compiler.compilers || compiler)) {
      const { entry, plugins } = comp.options;
      validateEntry(entry);

      const pluginExists = (plugins || []).some(
        (plugin) => plugin instanceof HotModuleReplacementPlugin
      );

      if (pluginExists) {
        throw new HotClientError(
          'HotModuleReplacementPlugin is automatically added to compilers. Please remove instances from your config before proceeding, or use the `autoConfigure: false` option.'
        );
      }
    }

    return true;
  },
};

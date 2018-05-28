'use strict';

const ParserHelpers = require('webpack/lib/ParserHelpers');
const stringify = require('json-stringify-safe');
const strip = require('strip-ansi');
const uuid = require('uuid/v4');
const { DefinePlugin, HotModuleReplacementPlugin } = require('webpack');
const HotClientError = require('./HotClientError');

function addEntry(entry, compilerName, options) {
  const clientEntry = [`webpack-hot-client/client?${compilerName || uuid()}`];
  let newEntry = {};

  if (!Array.isArray(entry) && typeof entry === 'object') {
    const keys = Object.keys(entry);
    if (options.allEntries) {
      for (const entryName of keys) {
        newEntry[entryName] = clientEntry.concat(entry[entryName]);
      }
    } else {
      const [first] = keys;
      newEntry[first] = clientEntry.concat(entry[first]);
    }
  } else {
    newEntry = clientEntry.concat(entry);
  }

  return newEntry;
}

function hotEntry(compiler, options) {
  if (compiler.options.target !== process.env.WHC_TARGET) {
    return;
  }

  const { entry } = compiler.options;
  const { name } = compiler;
  let newEntry;

  if (typeof entry === 'function') {
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
}

function hotPlugin(compiler) {
  const hmrPlugin = new HotModuleReplacementPlugin();

  /* istanbul ignore next */
  compiler.hooks.compilation.tap('HotModuleReplacementPlugin', (compilation, {
    normalModuleFactory
  }) => {
    const handler = (parser) => {
      parser.hooks.evaluateIdentifier.for('module.hot').tap({
        name: 'HotModuleReplacementPlugin',
        before: 'NodeStuffPlugin'
      }, expr => ParserHelpers.evaluateToIdentifier('module.hot', !!parser.state.compilation.hotUpdateChunkTemplate)(expr));
    };

    normalModuleFactory.hooks.parser.for('javascript/auto').tap('HotModuleReplacementPlugin', handler);
    normalModuleFactory.hooks.parser.for('javascript/dynamic').tap('HotModuleReplacementPlugin', handler);
  });

  hmrPlugin.apply(compiler);
}

function validateEntry(entry) {
  const type = typeof entry;
  const isArray = Array.isArray(entry);

  if (type !== 'function') {
    if (!isArray && type !== 'object') {
      throw new TypeError('webpack-hot-client: The value of `entry` must be an Array, Object, or Function. Please check your webpack config.');
    }

    if (!isArray && type === 'object') {
      for (const key of Object.keys(entry)) {
        const value = entry[key];
        if (!Array.isArray(value)) {
          throw new TypeError('webpack-hot-client: `entry` Object values must be an Array or Function. Please check your webpack config.');
        }
      }
    }
  }
}

module.exports = {

  modifyCompiler(compiler, options) {
    // this is how we pass the options at runtime to the client script
    const definePlugin = new DefinePlugin({
      __hotClientOptions__: stringify(options)
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

  payload(type, data) {
    return stringify({ type, data });
  },

  sendData(broadcast, stats, options) {
    const send = (type, data) => {
      broadcast(module.exports.payload(type, data));
    };

    if (stats.errors && stats.errors.length > 0) {
      if (options.send.errors) {
        const errors = [].concat(stats.errors).map(error => strip(error));
        send('errors', { errors });
      }
      return;
    }

    /* istanbul ignore if */
    if (stats.assets && stats.assets.every(asset => !asset.emitted)) {
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
  },

  validateCompiler(compiler) {
    for (const comp of [].concat(compiler.compilers || compiler)) {
      const { entry, plugins } = comp.options;
      validateEntry(entry);

      const pluginExists = (plugins || []).some(plugin => plugin instanceof HotModuleReplacementPlugin);

      if (pluginExists) {
        throw new HotClientError('HotModuleReplacementPlugin is automatically added to compilers. Please remove instances from your config before proceeding, or use the `autoConfigure: false` option.');
      }
    }
  }
};

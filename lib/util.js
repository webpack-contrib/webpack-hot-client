'use strict';

const ParserHelpers = require('webpack/lib/ParserHelpers');
const stringify = require('json-stringify-safe');
const uuid = require('uuid/v4');
const webpack = require('webpack');

function hotEntry(compiler) {
  if (compiler.options.target !== 'web') {
    return;
  }

  const { entry } = compiler.options;
  const { name } = compiler;
  const clientEntry = [`webpack-hot-client/client?${name || uuid()}`];
  let newEntry = {};

  if (!Array.isArray(entry) && typeof entry === 'object') {
    for (const key of Object.keys(entry)) {
      const value = entry[key];
      if (Array.isArray(value)) {
        newEntry[key] = clientEntry.concat(value);
      }
    }
  } else {
    newEntry = clientEntry.concat(entry);
  }

  if (compiler.hooks) {
    compiler.hooks.entryOption.call(compiler.options.context, newEntry);
  } else {
    compiler.applyPluginsBailResult('entry-option', compiler.options.context, newEntry);
  }
}

function hotPlugin(compiler) {
  const hmrPlugin = new webpack.HotModuleReplacementPlugin();

  if (compiler.hooks) {
    // webpack@4
    // eslint-disable-next-line no-loop-func
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
  } else {
    // webpack < 4
    // must come first
    hmrPlugin.apply(compiler);

    compiler.plugin('compilation', (compilation, data) => {
      data.normalModuleFactory.plugin('parser', (parser) => {
        // eslint-disable-next-line no-underscore-dangle
        parser._plugins['evaluate Identifier module.hot'].reverse();
      });
    });
  }
}

module.exports = {

  modifyCompiler(compiler, options) {
    // this is how we pass the options at runtime to the client script
    const definePlugin = new webpack.DefinePlugin({
      __hotClientOptions__: stringify(options)
    });

    for (const comp of [].concat(compiler.compilers || compiler)) {
      hotEntry(comp);

      options.log.debug('Applying DefinePlugin:__hotClientOptions__');
      definePlugin.apply(comp);

      hotPlugin(comp);
    }
  },

  payload(type, data) {
    return stringify({ type, data });
  },

  sendStats(broadcast, stats) {
    const send = (type, data) => {
      broadcast(module.exports.payload(type, data));
    };

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
  },

  validateEntry(compiler) {
    for (const comp of [].concat(compiler.compilers || compiler)) {
      const { entry } = comp.options;
      const type = typeof entry;
      const isArray = Array.isArray(entry);

      if (!isArray && type !== 'object') {
        throw new TypeError('webpack-hot-client: The value of `entry` must be an Array or Object. Please check your webpack config.');
      }

      if (!isArray && type === 'object') {
        for (const key of Object.keys(entry)) {
          const value = entry[key];
          if (!Array.isArray(value)) {
            throw new TypeError('webpack-hot-client: `entry` Object values must be an Array. Please check your webpack config.');
          }
        }
      }
    }
  }
};

'use strict';

const MultiEntryPlugin = require('webpack/lib/MultiEntryPlugin');
const DynamicEntryPlugin = require('webpack/lib/DynamicEntryPlugin');
const uuid = require('uuid/v4');

module.exports = class HotClientEntryPlugin {
  // eslint-disable-next-line class-methods-use-this
  toPlugin(compiler, context, item, name) {
    const hotEntry = [];

    if (compiler.options.target === 'web') {
      hotEntry.push(`webpack-hot-client/client?${name || uuid()}`);
    }

    const entry = hotEntry.concat(item);

    return new MultiEntryPlugin(context, entry, name);
  }

  apply(compiler) {
    compiler.plugin('entry-option', (context, entry) => {
      if (typeof entry === 'string' || Array.isArray(entry)) {
        compiler.apply(this.toPlugin(compiler, context, entry, 'main'));
      } else if (typeof entry === 'object') {
        Object.keys(entry).forEach(name => compiler.apply(this.toPlugin(compiler, context, entry[name], name)));
      } else if (typeof entry === 'function') {
        // TODO support functions
        compiler.apply(new DynamicEntryPlugin(context, entry));
      }
      return true;
    });
  }
};

'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const loglevel = require('loglevelnext/dist/loglevelnext.min');

const { MethodFactory } = loglevel.factories;
const css = {
  prefix: 'color: #999; padding: 0 0 0 20px; line-height: 16px; background: url(https://webpack.js.org/6bc5d8cf78d442a984e70195db059b69.svg) no-repeat; background-size: 16px 16px; background-position: 0 -2px;',
  reset: 'color: #444'
};
const log = loglevel.getLogger({ name: 'hot', id: 'hot-middleware/client' });

function IconFactory(logger) {
  MethodFactory.call(this, logger);
}

IconFactory.prototype = Object.create(MethodFactory.prototype);
IconFactory.prototype.constructor = IconFactory;

IconFactory.prototype.make = function make(methodName) {
  const og = MethodFactory.prototype.make.call(this, methodName);

  return function _(...params) {
    const args = [].concat(params);
    const prefix = '%c｢hot｣ %c';
    const [first] = args;

    if (typeof first === 'string') {
      args[0] = prefix + first;
    } else {
      args.unshift(prefix);
    }

    args.splice(1, 0, css.prefix, css.reset);
    og(...args);
  };
};

log.factory = new IconFactory(log, {});

log.group = console.group; // eslint-disable-line no-console
log.groupCollapsed = console.groupCollapsed; // eslint-disable-line no-console
log.groupEnd = console.groupEnd; // eslint-disable-line no-console

module.exports = log;

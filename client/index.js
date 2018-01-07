'use strict';

/* global window, __hotClientOptions__ */

// this is piped in at runtime build via DefinePlugin in /lib/plugins.js
// eslint-disable-next-line no-unused-vars, no-undef
const options = __hotClientOptions__;

const log = require('./log'); // eslint-disable-line import/order

log.level = options.logLevel;

const update = require('./hot');
const socket = require('./socket');

if (!options) {
  throw new Error('Something went awry and __hotClientOptions__ is undefined. Possible bad build. HMR cannot be enabled.');
}

let currentHash;
let initial = true;
let isUnloading;

window.addEventListener('beforeunload', () => {
  isUnloading = true;
});

function reload() {
  if (isUnloading) {
    return;
  }

  if (options.hot) {
    log.info('App Updated, Reloading Modules');
    update(currentHash);
  } else {
    log.info('Refreshing Page');
    window.location.reload();
  }
}

socket(options, {
  compile() {
    log.info('webpack: Compiling...');
  },

  errors(errors) {
    log.error('webpack: Encountered errors while compiling. Reload prevented.');

    for (let i = 0; i < errors.length; i++) {
      log.error(errors[i]);
    }
  },

  hash(hash) {
    currentHash = hash;
  },

  invalid() {
    log.info('App updated. Recompiling');
  },

  ok() {
    if (initial) {
      initial = false;
      return initial;
    }

    reload();
  },

  warnings(warnings) {
    log.warn('Warnings while compiling.');

    for (let i = 0; i < warnings.length; i++) {
      log.warn(warnings[i]);
    }

    if (initial) {
      initial = false;
      return initial;
    }

    reload();
  }

});

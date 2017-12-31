'use strict';

const update = require('./hmr');
const log = require('./log');
const socket = require('./socket');

// this is piped in at runtime build via DefinePlugin in /lib/plugins.js
// eslint-disable-next-line no-unused-vars, no-undef
const options = HOT_MIDDLEWARE_OPTIONS;

let currentHash;
let initial;
let isUnloading;

log.level = options.logLevel;

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

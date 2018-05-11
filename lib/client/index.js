'use strict';

/* eslint-disable global-require */

(function hotClientEntry() {
  // eslint-disable-next-line no-underscore-dangle
  if (window.__webpackHotClient__) {
    return;
  }

  // eslint-disable-next-line no-underscore-dangle
  window.__webpackHotClient__ = {};

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
      update(currentHash, options);
    } else if (options.reload) {
      log.info('Refreshing Page');
      window.location.reload();
    } else {
      log.warn('Please refresh the page manually.');
      log.info('The `hot` and `reload` options are set to false.');
    }
  }

  socket(options, {
    compile({ compilerName }) {
      log.info(`webpack: Compiling (${compilerName})`);
    },

    errors({ errors }) {
      log.error('webpack: Encountered errors while compiling. Reload prevented.');

      for (let i = 0; i < errors.length; i++) {
        log.error(errors[i]);
      }
    },

    hash({ hash }) {
      currentHash = hash;
    },

    invalid({ fileName }) {
      log.info(`App updated. Recompiling ${fileName}`);
    },

    ok() {
      if (initial) {
        initial = false;
        return initial;
      }

      reload();
    },

    'window-reload': () => {
      window.location.reload();
    },

    warnings({ warnings }) {
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
}());

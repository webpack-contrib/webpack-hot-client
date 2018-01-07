'use strict';

/* eslint no-console: off */
/* global document */

const target = document.querySelector('#target');
target.innerHTML = 'entry!';

if (typeof module.hot === 'object') {
  module.hot.accept((err) => {
    if (err) {
      console.error('Cannot apply HMR update.', err);
    }
  });
}

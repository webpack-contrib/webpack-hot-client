/* eslint no-console: off */

require('./component');

if (module.hot) {
  module.hot.accept((err) => {
    if (err) {
      console.error('Cannot apply HMR update.', err);
    }
  });
}

console.log('dirty');
console.log('dirty');
console.log('dirty');
console.log('dirty');
console.log('dirty');

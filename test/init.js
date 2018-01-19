'use strict';

/* eslint global-require: off */
/* global window */

const assert = require('assert');
const webpack = require('webpack');
const client = require('../index');

describe('Webpack Hot Client', () => {
  it('should exist', () => {
    assert(client);
  });

  it('should reject string entry', () => {
    const config = require('./fixtures/webpack.config-invalid.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info', test: true };

    assert.throws(() => { client(compiler, options); });
  });

  it('should reject object with string entry', () => {
    const config = require('./fixtures/webpack.config-invalid-object.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info', test: true };

    assert.throws(() => { client(compiler, options); });
  });

  it('should allow object with string array entry', (done) => {
    const config = require('./fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel: 'info', test: true };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 1000);
  });
});

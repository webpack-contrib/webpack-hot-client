'use strict';

/* eslint global-require: off */
/* global window */

const webpack = require('webpack');
const client = require('../../index');

const logLevel = 'silent';

describe('Webpack Hot Client', () => {
  beforeEach(() => {
    process.env.WHC_TARGET = '';
  });

  it('should exist', () => {
    expect(client).toBeDefined();
  });

  it('should reject string entry', () => {
    const config = require('../fixtures/webpack.config-invalid.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };

    expect(() => { client(compiler, options); }).toThrow();
  });

  it('should reject object with string entry', () => {
    const config = require('../fixtures/webpack.config-invalid-object.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };

    expect(() => { client(compiler, options); }).toThrow();
  });

  it('should allow string array entry', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('should allow object with string array entry', (done) => {
    const config = require('../fixtures/webpack.config-object.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);

  it('should set WHC_TARGET to web', (done) => {
    const config = require('../fixtures/webpack.config-array.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => {
      expect(process.env.WHC_TARGET).toBe('web');
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow setting WHC_TARGET', (done) => {
    process.env.WHC_TARGET = 'electron-renderer';

    const config = require('../fixtures/webpack.config-array.js');
    config.target = 'electron-renderer';

    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => {
      expect(process.env.WHC_TARGET).toBe('electron-renderer');
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should allow function entry that returns array', (done) => {
    const config = require('../fixtures/webpack.config-function.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => {
      compiler.run(() => { close(done); });
    }, 2000);
  }).timeout(4000);

  it('should reject function entry that returns string', (done) => {
    const config = require('../fixtures/webpack.config-function-invalid.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => {
      expect(() => { compiler.run(); }).toThrowError(/must be an Array/);
      close(done);
    }, 2000);
  }).timeout(4000);

  it('should function with MultiCompiler config', (done) => {
    const config = require('../fixtures/multi/webpack.config.js');
    const compiler = webpack(config);
    const options = { hot: true, logLevel };
    const { close } = client(compiler, options);

    setTimeout(() => { close(done); }, 2000);
  }).timeout(4000);
});

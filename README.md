<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]

# webpack-hot-client

A client for enabling, and interacting with, webpack [Hot Module Replacement][hmr-docs].

This is intended to work in concert with [`webpack-dev-middleware`][dev-middleware]
and allows for adding Hot Module Replacement to an existing server, without a
dependency upon [`webpack-dev-server`][dev-server]. This comes in handy for testing
in projects that already use server frameworks such as `Express` or `Koa`.

`webpack-hot-client` accomplishes this by creating a `WebSocket` server, providing
the necessary client (browser) scripts that communicate via `WebSocket`s, and
automagically adding the necessary webpack plugins and config entries. All of
that allows for a seamless integration of Hot Module Support.

## Getting Started

To begin, you'll need to install `webpack-hot-client`:

```console
$ npm install webpack-hot-client --save-dev
```

_Reminder: You don't have to modify your config at all!_

### Express

For setting up the module for use with an `Express` server, try the following:

```js
const client = require('webpack-hot-client');
const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);
const { publicPath } = config.output;
const options = { ... }; // webpack-hot-client options

// we recommend calling the client _before_ adding the dev middleware
client(compiler, options);

app.use(middleware(compiler, { publicPath }));
```

### Koa

Since `Koa`@2.0.0 was released, the patterns and requirements for using
`webpack-dev-middleware` have changed somewhat, due to use of `async/await` in
Koa. As such, one potential solution is to use [`koa-webpack`][koa-webpack],
which wires up the dev middleware properly for Koa, and also implements this
module. If you'd like to use both modules without `koa-webpack`, you may examine
that module's code for implementation details.

## Browser Support

Because this module leverages _native_ `WebSockets`, the browser support for this
module is limited to only those browsers which support native `WebSocket`. That
typically means the last two major versions of a particular browser.

_Note: We won't be accepting requests for changes to this facet of the module._

## API

### client(compiler, [options])

Returns an `Object` containing:

- `close()` *(Function)* - Closes the WebSocketServer started by the module.
- `wss` *(WebSocketServer)* - A WebSocketServer instance.

#### options

Type: `Object`

##### host

Type: `Object`  
Default: `'localhost'`

Sets the host that the `WebSocket` server will listen on. If this doesn't match
the host of the server the module is used with, the module will not function
properly.

##### hot

Type: `Boolean`  
Default: `True`

If true, instructs the client script to attempt hot patching of modules.

##### https

Type: `Boolean`  
Default: `false`

If true, instructs the client script to use `wss://` as the `WebSocket` protocol.
If you're using a server setup with `HTTPS`, you must set this to `true` or the
sockets cannot communicate and this module won't function properly.

##### logLevel

Type: `String`  
Default: `'info'`

Sets the minimum level of logs that will be displayed in the console. Please see
[webpack-log/#levels][levels] for valid values.

##### logTime

Type: `Boolean`  
Default: `false`

If true, instructs the internal logger to prepend log output with a timestamp.

##### port

Type: `Number`  
Default: `8081`

The port the `WebSocket` server should listen on. It's recommended that a
[`server`](#server) instance is passed to assure there aren't any port conflicts.

##### reload

Type: `Boolean`  
Default: `true`

If true, instructs the browser to physically refresh the entire page if / when
webpack indicates that a hot patch cannot be applied and a full refresh is needed.

##### server

Type: `Object`  
Default: `null`

If a server instance (eg. Express or Koa) is provided, the `WebSocket` server
will attempt to attach to the server instance instead of using a separate port.

##### stats

Type: `Object`  
Default: `{ context: process.cwd() }`

An object specifying the webpack [stats][stats] configuration. This does not
typically need to be modified.

## Contributing

We welcome your contributions! Please have a read of [CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to get involved.

## License

#### [MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/webpack-hot-client.svg
[npm-url]: https://npmjs.com/package/webpack-hot-client

[node]: https://img.shields.io/node/v/webpack-hot-client.svg
[node-url]: https://nodejs.org

[deps]: https://david-dm.org/webpack-contrib/webpack-hot-client.svg
[deps-url]: https://david-dm.org/webpack-contrib/webpack-hot-client

[tests]: http://img.shields.io/travis/webpack-contrib/webpack-hot-client.svg
[tests-url]: https://travis-ci.org/webpack-contrib/webpack-hot-client

[cover]: https://codecov.io/gh/webpack-contrib/webpack-hot-client/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/webpack-hot-client

[chat]: https://badges.gitter.im/webpack/webpack.svg
[chat-url]: https://gitter.im/webpack/webpack

[koa-webpack]: https://github.com/shellscape/koa-webpack
[dev-middleware]: https://github.com/webpack/webpack-dev-middleware
[dev-server]: https://github.com/webpack/webpack-dev-server
[hmr-docs]: https://webpack.js.org/concepts/hot-module-replacement/
[stats]: https://webpack.js.org/configuration/stats/#stats
[levels]: https://github.com/webpack-contrib/webpack-log#level

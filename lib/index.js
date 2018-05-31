const getOptions = require('./options');
const getSocketServer = require('./socket-server');
const { modify, validate } = require('./compiler');

module.exports = (compiler, opts) => {
  const options = getOptions(opts);
  const { log } = options;

  if (options.autoConfigure) {
    validate(compiler);
  }

  /* istanbul ignore if */
  if (options.host.client !== options.host.server) {
    log.warn(
      '`options.host.client` does not match `options.host.server`. This can cause unpredictable behavior in the browser.'
    );
  }

  const { broadcast, close, payload, sendData, server } = getSocketServer(
    options
  );

  modify(compiler, options);

  const compile = (comp) => {
    const compilerName = comp.name || '<unnamed compiler>';
    options.stats = null;
    log.info('webpack: Compiling...');
    broadcast(payload('compile', { compilerName }));
  };

  const done = (result) => {
    log.info('webpack: Compiling Done');
    options.stats = result;

    const jsonStats = options.stats.toJson(options.stats);

    /* istanbul ignore if */
    if (!jsonStats) {
      options.log.error('compiler done: `stats` is undefined');
    }

    sendData(jsonStats, options);
  };

  const invalid = (filePath, comp) => {
    const context = comp.context || comp.options.context || process.cwd();
    const fileName = (filePath || '<unknown>')
      .replace(context, '')
      .substring(1);
    log.info('webpack: Bundle Invalidated');
    broadcast(payload('invalid', { fileName }));
  };

  // as of webpack@4 MultiCompiler no longer exports the compile hook
  const compilers = compiler.compilers || [compiler];
  for (const comp of compilers) {
    comp.hooks.compile.tap('WebpackHotClient', () => {
      compile(comp);
    });

    // we need the compiler object reference here, otherwise we'd let the
    // MultiHook do it's thing in a MultiCompiler situation.
    comp.hooks.invalid.tap('WebpackHotClient', (filePath) => {
      invalid(filePath, comp);
    });
  }

  compiler.hooks.done.tap('WebpackHotClient', done);

  return {
    close,
    options: Object.freeze(Object.assign({}, options)),
    server,
  };
};

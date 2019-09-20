module.exports = class HotClientError extends Error {
  constructor(message) {
    super(`webpack-hmr-client: ${message}`);
  }
};

# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="1.1.0"></a>
# 1.1.0 (2019-09-20)


### Bug Fixes

* __hotClientOptions__ when autoConfigure: false ([#65](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/65)) ([5cc12b7](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/5cc12b7))
* apply DefinePlugin beforeCompile, and only once ([#73](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/73)) ([b3ba36c](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/b3ba36c))
* duplicate logging in MultiCompilers. fixes [#47](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/47) ([#59](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/59)) ([411ecf9](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/411ecf9))
* fixes [#86](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/86), client port bungle ([#87](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/87)) ([7a95e20](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/7a95e20))
* https option for https.Server ([#81](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/81)) ([0ac0673](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/0ac0673))
* include schemas in package files ([e059dc0](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/e059dc0))
* incorrect check for existing socket clients ([#77](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/77)) ([4b347c8](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/4b347c8)), closes [#61](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/61)
* multiple entries, add autoConfigure option ([#58](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/58)) ([1e6c6b2](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/1e6c6b2))
* prevent validation errors if no options passed ([#75](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/75)) ([0e56e17](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/0e56e17))
* strip ansi from warnings, errors. fixes [#46](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/46) ([#57](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/57)) ([3f128db](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/3f128db))
* throw error when HMR plugin exists in config ([#66](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/66)) ([22c7e68](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/22c7e68))
* webpack-defaults to devDeps ([fbece68](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/fbece68))


### Features

* allEntries applies client entry to all entries ([#64](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/64)) ([ea7625e](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/ea7625e))
* granular control of client warnings, errors. fixes [#55](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/55) ([#56](https://github.com/hedgepigdaniel/webpack-hmr-client/issues/56)) ([e830535](https://github.com/hedgepigdaniel/webpack-hmr-client/commit/e830535))

# fuse-box-node-plugin
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Build Status](https://travis-ci.com/wmathes/fuse-box-node-plugin.svg)](https://travis-ci.org/wmathes/fuse-box-node-plugin)
[![GitHub issues](https://img.shields.io/github/issues/wmathes/fuse-box-node-plugin.svg)](https://github.com/wmathes/fuse-box-node-plugin/issues)
[![devDependencies Status](https://david-dm.org/wmathes/fuse-box-node-plugin/dev-status.svg)](https://david-dm.org/wmathes/fuse-box-node-plugin?type=dev)
[![dependencies Status](https://david-dm.org/wmathes/fuse-box-node-plugin/status.svg)](https://david-dm.org/wmathes/fuse-box-node-plugin)

Plugin for [fuse-box](https://fuse-box.org) to allow inclusion of `.node` binaries and related dependencies

## Usage
Install via `npm i fuse-box-node-plugin --save-dev`.

## Configuration
`NodePlugin` follows the factorization and configuration pattern of official fuse-box plugins.

Including `const {NodePlugin} = require("fuse-box-node-plugin");` will return a factory function, which accepts an options literal in the following format:

```ts
interface NodePluginOptions {
    // file path to the .node file
    file: string;

    // a root folder to be used when copying over, defaults to file's dirname
    root?: string;

    // output folder for NodePlugin assets. defaults to "modules"
    moduleFolder?: string

    // defaults to file's basename, defines subfolder in moduleFolder
    identifier?: string;

    // a list of globs relative root-folder, matching files will be copied into the bundle
    relativeDependencies?: string[];
}
```

## Examples

### Usage with [sharp](https://github.com/lovell/sharp/)
The sharp-package creates platform specific files during npm's prebuild-step.
- a native node module `sharp.node` in `node_modules/sharp/Build/Release/`
- a few dozen library files in `node_modules/sharp/vendor/`

`sharp.node` requires most of these files, depending on features used in your code, and looks for them relative to itself.

To include `sharp` in your fuse-box bundle add `NodePlugin` to your plugin configuration:
```js
plugins: [
  NodePlugin({
      file: "node_modules/sharp/build/Release/sharp.node",
      root: "node_modules/sharp",
      relativeDependencies: ["**.dll", "vendor/**"]
  })
]
```

This will generate a `modules/sharp/` directory in your configured output, which mirrors the tree structure of `node_modules/sharp` for all files matching `relativeDependencies`.

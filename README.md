# fuse-box-node-plugin
Plugin for [fuse-box](https://fuse-box.org) to allow inclusion of `.node` binaries and related dependencies

Intented to be released completely on npm in the near future. 

## Configuration
```ts
interface NodePluginOptions {
    file: string; // file path to the .node file
    root?: string; // a root folder to be used when copying over 
    identifier?: string;
    relativeDependencies?: string[];
}
```

file: set file to your `.node` file.
root: a folder to be used as module root. Should be set to the lowest common directory of your relative dependencies and .node file, defaults to file's directory.
identifier: overrides identifier when facing module with equal file names, defaults to the file name w/o extension.
relativeDependencies: a list of globs for dependencies relative to file.

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




# TSConfig Grimoire

A collection of sacred information to deal with `tsconfig.json` for tooling authors and maintainers (that should ideally be documented in the TypeScript docs in the first place).

For general documentation of tsconfig options, see the [official TSConfig docs](https://www.typescriptlang.org/tsconfig/). This document focuses on the tooling around tsconfigs, e.g. how it's searched, merged, prioritized, special behaviors, and other nuances.

If you have other questions about `tsconfig.json` not answered here, please [open an issue](https://github.com/bluwy/tsconfig-grimoire/issues/new).

> **Updated for TypeScript 5.9**

## Searching `tsconfig.json`

If a project has multiple `tsconfig.json` files, TypeScript officially handles this with two strategies.

1. **Single strategy:** uses a single `tsconfig.json` only, e.g. `tsc -p ./tsconfig.json`

   With the TypeScript compiler (the `tsc` CLI), only a single tsconfig is used at a time. It defaults to the `tsconfig.json` in the current working directory, or a different path via the `-p`/`--project` flag.

   Type-checking and compilation is only done on the files included in that tsconfig.

2. **Nearest matching strategy:** uses nearest matching `tsconfig.json`, e.g. VS Code

   The TypeScript language server uses a different strategy as files are opened one at a time. The nearest matching `tsconfig.json` searched upwards from the file's directory is used as the config for that file. A matched tsconfig is one that [includes](#included-files-resolution) the file.

   This works similarly enough to strategy no1 that there's no difference in practice, however edge cases can happen if, e.g. multiple tsconfigs include the same file, or a tsconfig includes files outside its own directory.

So which strategy should you use then? In many cases, you should use strategy no2, unless you're building a tool that only handles a set of files included by a tsconfig, similar to how `tsc` works.

If the matched `tsconfig.json` has a `references` field, check out the [Project references](#project-references) section for how to handle that.

## Included files resolution

TSConfig has the `files`, `include`, `exclude`, and `references` fields to determine which files are included by the tsconfig.

- **`files`**: A list of file paths to include. It is not affected by `exclude` or other implicit behaviors, which mean you can also include files in `node_modules`.

  If `include` is specified, its globbed files will be merged with `files`. If `include` is not specified, only paths in `files` will be used.

- **`include`**: A list of glob patterns to include. If not specified, it defaults to globbing all `.ts` files. If `compilerOptions.checkJs` is `true`, it also globs `.js` files. External tooling may also include `.vue`, `.svelte` files, etc, but it's not standard within TypeScript.

  The glob patterns only support a [small subset of glob features](https://www.typescriptlang.org/tsconfig/#include). TypeScript manually implements the pattern matching and does not use any glob libraries.

- **`exclude`**: A list of glob patterns to exclude from `include`. If not specified, it defaults to excluding `node_modules`, `bower_components`, `jspm_packages`, and the output directory specified in `compilerOptions.outDir` (if set).

  In contrary to the documentation, `node_modules`, `bower_components`, and `jspm_packages` are always excluded regardless if they're specified in `exclude` or not.

  The glob patterns also work the same as `include`.

- **`references`**: A list of other tsconfigs that should be part of this (root) tsconfig. If a file is not included in the root tsconfig, it should also be checked if it's included in any of the referenced tsconfigs (using the same rules above). Project references only go one-level deep, so the referenced tsconfigs' own references are not considered. See the [Project references](#project-references) section for more details.

> [!TIP]
> Use the [TSConfig Helper](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.vscode-tsconfig-helper) VS Code extension to easily debug which files are included by a tsconfig.

## Project references

Project references allow composing multiple tsconfigs into a single build. See the [official docs](https://www.typescriptlang.org/docs/handbook/project-references.html) for its general use case and behavior.

The related tsconfig for a file in this setup also works differently depending on the search strategy as discussed in [Searching `tsconfig.json`](#searching-tsconfigjson).

1. For the **Single strategy**, each referenced tsconfigs are iterated first for their included files and runs type-checking and compilation in order. If multiple referenced tsconfigs include the same file, then the file would run twice. After that, if the root tsconfig includes any files not included by the referenced tsconfigs, those files would be type-checked and compiled last.

2. For the **Nearest matching strategy**, the nearest matching `tsconfig.json` is searched upwards from the file's directory as usual, and the referenced tsconfigs are then iterated and checked if they include the file. This also means that only a single referenced tsconfig can apply to the file at a time. If none of the referenced tsconfigs include the file, then it falls back to checking if the root tsconfig includes the file.

If a referenced tsconfig happens to be named as `tsconfig.json`, e.g. it's located in a subdirectory, and the tsconfig includes the file, TypeScript would not continue searching upwards for the root tsconfig, even if the referenced tsconfig has `composite: true` set. In practice this doesn't affect type-checking or compilation results. The only difference is that the tooling wouldn't know of the root tsconfig.

> [!NOTE]
> Project references may sometimes also be referred to as "solutions" or "solution-style tsconfigs", which are simply root tsconfigs with `"files": []` set, which means in practice its purpose is to only group the referenced tsconfigs together and does not run type-checking or compilation on its own files. Today, that is the only significant meaning for "solutions".
>
> However, when solutions were first introduced (or coined in TypeScript) in [TypeScript 3.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#support-for-solution-style-tsconfigjson-files), its [original PR](https://github.com/microsoft/TypeScript/pull/37239) notes that:
>
> > Now when we find that the project is a solution project, we try to open referenced projects to see if we can find project that contains the opened file.
>
> Which you may have noticed is exactly the same behavior in normal project references today. Previously, the root `tsconfig.json` needed to also include the files included by the referenced tsconfigs to work, but is no longer the case. So in practice, you shouldn't need to handle solutions specifically. Normal project references handling will also indirectly handle solutions.
>
> Also interestingly with solutions, the referenced tsconfigs do not need to have `composite: true` set. However, it's probably still a good idea to set it for correctness and future-proofing.

## Path resolution

## Compiler options default

Certain fields

## `jsconfig.json`

`jsconfig.json` is a semi-standard TypeScript config supported by IDEs (or specifically the TypeScript language server). Unless you're building an IDE or language server plugin, you shouldn't need to account for this file.

The file works like a normal `tsconfig.json`, except it has a [different `compilerOptions` default](https://github.com/microsoft/TypeScript/blob/669c25c091ad4d32298d0f33b0e4e681d46de3ea/src/compiler/commandLineParser.ts#L3722-L3727):

```json
{
  "compilerOptions": {
    "allowJs": true,
    "maxNodeModuleJsDepth": 2,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

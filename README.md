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

The [`references`](https://www.typescriptlang.org/tsconfig/#references) field allow composing multiple tsconfigs into a single build. See the [official docs](https://www.typescriptlang.org/docs/handbook/project-references.html) for its general use case and behavior.

The related tsconfig for a file in this setup also works differently depending on the search strategy as discussed in [Searching `tsconfig.json`](#searching-tsconfigjson).

1. For the **Single strategy**, each referenced tsconfigs are iterated first for their included files and runs type-checking and compilation in order. If multiple referenced tsconfigs include the same file, then the file would run twice. After that, if the root tsconfig includes any files not included by the referenced tsconfigs, those files would be type-checked and compiled last.

2. For the **Nearest matching strategy**, the nearest matching `tsconfig.json` is searched upwards from the file's directory as usual, and the referenced tsconfigs are then iterated and checked if they include the file. This also means that only a single referenced tsconfig can apply to the file at a time. If none of the referenced tsconfigs include the file, then it falls back to checking if the root tsconfig includes the file.

Note that the [`references`](https://www.typescriptlang.org/tsconfig/#references) field only work for the root tsconfig. If referenced tsconfigs have their own `references` field, the field is ignored.

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

## Extends field

The [`extends`](https://www.typescriptlang.org/tsconfig/#extends) field allows inheriting fields from other tsconfig files. It accepts relative paths or package identifiers (to reference tsconfigs exported by npm packages).

If `extends` is an array, or if the extended tsconfig also has an `extends` field, they're inherited sequentially in a depth-first manner, for example (each alphabet represents a tsconfig file):

```
R -> A, B, C
B -> D, E
```

If `R` is the root tsconfig, the inheritance order would be `R -> C -> B -> E -> D -> A` (Read as `R` inherits fields from `C`, which inherits from `B`, ...). If this feels reversed, you can also actually reverse the concept here as `A <- D <- E <- B <- C <- R` (Read as `A` fields is overridden by `D`, which is overridden by `E`, ...). Implementation-wise, both work the same.

Internally, you may want to represent these tsconfigs as a single merged tsconfig. See the [Merging tsconfigs](#merging-tsconfigs) section for the merge behavior.

## Merging tsconfigs

When merging tsconfigs, you can do so in either direction as described in the [Extends field](#extends-field) section. Inheritance-style or override-style.

While merging two tsconfigs, they follow some specific rules:

- Objects are merged recursively. For example, `compilerOptions`, `watchOptions`, etc. Except for objects nested in arrays, e.g. `compilerOptions.plugins` items.
- All other field types are merged via replacing itself entirely, e.g. strings, booleans, arrays, etc. Note that arrays are replaced entirely, not concatenated. For example, `files`, `compilerOptions.outDir`, etc.
- Fields may be `null`, which is a special ([poorly-documented](https://github.com/microsoft/TypeScript/issues/21443)) value that removes the field from the intermediate merge result, indicating that the default value should be used.
- The only field that does not ever merge is `references`. The field should only be specified in the rot tsconfig.

## Path resolution

A tsconfig file have fields that can accept paths:

- [`files`](https://www.typescriptlang.org/tsconfig/#files)
- [`include`](https://www.typescriptlang.org/tsconfig/#include)
- [`exclude`](https://www.typescriptlang.org/tsconfig/#exclude)
- [`compilerOptions.declarationDir`](https://www.typescriptlang.org/tsconfig/#declarationDir)
- [`compilerOptions.tsBuildInfoFile`](https://www.typescriptlang.org/tsconfig/#tsBuildInfoFile)
- [`compilerOptions.outDir`](https://www.typescriptlang.org/tsconfig/#outDir)
- [`compilerOptions.rootDir`](https://www.typescriptlang.org/tsconfig/#rootDir)
- [`compilerOptions.typeRoots`](https://www.typescriptlang.org/tsconfig/#typeRoots)

Relative paths in these fields are resolved relative to the tsconfig file's directory, even if it's is extended by a root tsconfig. If it should be resolved relative to the root tsconfig instead, the paths should start with `${configDir}/`.

## Compiler options computed defaults

The `compilerOptions` have certain fields with defaults computed via other fields. While this is already documented in the [official docs](https://www.typescriptlang.org/tsconfig/), here is summary of all fields that have computed defaults:

<!-- prettier-ignore -->
| Option | Default |
| - | - |
| [`allowSyntheticDefaultImports`](d3)  | `true` if [`esModuleInterop`](d0) is enabled, [`module`](d1) is `system`, or [`moduleResolution`](d2) is `bundler`; `false` otherwise. |
| [`alwaysStrict`](d5)                  | `true` if [`strict`](d4); `false` otherwise. |
| [`declaration`](d7)                   | `true` if [`composite`](d6); `false` otherwise. |
| [`esModuleInterop`](d0)               | `true` if [`module`](d1) is `node16`, `nodenext`, or `preserve`; `false` otherwise. |
| [`exclude`](d9)                       | node_modules bower_components jspm_packages [`outDir`](d8) |
| [`include`](d11)                      | `[]` if [`files`](d10) is specified; `**/*` otherwise. |
| [`incremental`](d12)                  | `true` if [`composite`](d6); `false` otherwise. |
| [`isolatedModules`](d14)              | `true` if [`verbatimModuleSyntax`](d13); `false` otherwise. |
| [`jsxFactory`](d15)                   | React.createElement |
| [`locale`](d16)                       | Platform specific. |
| [`module`](d1)                        | `CommonJS` if [`target`](d17) is `ES5`; `ES6`/`ES2015` otherwise. |
| [`moduleResolution`](d2)              | `Node10` if [`module`](d1) is `CommonJS`; `Node16` if [`module`](d1) is `Node16`, `Node18`, or `Node20`; `NodeNext` if [`module`](d1) is `NodeNext`; `Bundler` if [`module`](d1) is `Preserve`; `Classic` otherwise. |
| [`newLine`](d18)                      | `lf` |
| [`noImplicitAny`](d19)                | `true` if [`strict`](d4); `false` otherwise. |
| [`noImplicitThis`](d20)               | `true` if [`strict`](d4); `false` otherwise. |
| [`preserveConstEnums`](d21)           | `true` if [`isolatedModules`](d14); `false` otherwise. |
| [`reactNamespace`](d22)               | React |
| [`resolvePackageJsonExports`](d23)    | `true` when [`moduleResolution`](d2) is `node16`, `nodenext`, or `bundler`; otherwise `false` |
| [`resolvePackageJsonImports`](d24)    | `true` when [`moduleResolution`](d2) is `node16`, `nodenext`, or `bundler`; otherwise `false` |
| [`rootDir`](d25)                      | Computed from the list of input files. |
| [`rootDirs`](d26)                     | Computed from the list of input files. |
| [`strictBindCallApply`](d27)          | `true` if [`strict`](d4); `false` otherwise. |
| [`strictBuiltinIteratorReturn`](d28)  | `true` if [`strict`](d4); `false` otherwise. |
| [`strictFunctionTypes`](d29)          | `true` if [`strict`](d4); `false` otherwise. |
| [`useUnknownInCatchVariables`](d30)   | `true` if [`strict`](d4); `false` otherwise. |
| [`strictPropertyInitialization`](d31) | `true` if [`strict`](d4); `false` otherwise. |
| [`strictNullChecks`](d32)             | `true` if [`strict`](d4); `false` otherwise. |
| [`target`](d17)                       | `es2023` if [`module`](d1) is `node20`; `esnext` if [`module`](d1) is `nodenext`; `ES5` otherwise. |
| [`useDefineForClassFields`](d33)      | `true` if [`target`](d17) is `ES2022` or higher, including `ESNext`; `false` otherwise. |
| [`allowImportingTsExtensions`](d35)   | `true` if [`rewriteRelativeImportExtensions`](d34); `false` otherwise. |

[d0]: https://www.typescriptlang.org/tsconfig/#esModuleInterop
[d1]: https://www.typescriptlang.org/tsconfig/#module
[d2]: https://www.typescriptlang.org/tsconfig/#moduleResolution
[d3]: https://www.typescriptlang.org/tsconfig/#allowSyntheticDefaultImports
[d4]: https://www.typescriptlang.org/tsconfig/#strict
[d5]: https://www.typescriptlang.org/tsconfig/#alwaysStrict
[d6]: https://www.typescriptlang.org/tsconfig/#composite
[d7]: https://www.typescriptlang.org/tsconfig/#declaration
[d8]: https://www.typescriptlang.org/tsconfig/#outDir
[d9]: https://www.typescriptlang.org/tsconfig/#exclude
[d10]: https://www.typescriptlang.org/tsconfig/#files
[d11]: https://www.typescriptlang.org/tsconfig/#include
[d12]: https://www.typescriptlang.org/tsconfig/#incremental
[d13]: https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax
[d14]: https://www.typescriptlang.org/tsconfig/#isolatedModules
[d15]: https://www.typescriptlang.org/tsconfig/#jsxFactory
[d16]: https://www.typescriptlang.org/tsconfig/#locale
[d17]: https://www.typescriptlang.org/tsconfig/#target
[d18]: https://www.typescriptlang.org/tsconfig/#newLine
[d19]: https://www.typescriptlang.org/tsconfig/#noImplicitAny
[d20]: https://www.typescriptlang.org/tsconfig/#noImplicitThis
[d21]: https://www.typescriptlang.org/tsconfig/#preserveConstEnums
[d22]: https://www.typescriptlang.org/tsconfig/#reactNamespace
[d23]: https://www.typescriptlang.org/tsconfig/#resolvePackageJsonExports
[d24]: https://www.typescriptlang.org/tsconfig/#resolvePackageJsonImports
[d25]: https://www.typescriptlang.org/tsconfig/#rootDir
[d26]: https://www.typescriptlang.org/tsconfig/#rootDirs
[d27]: https://www.typescriptlang.org/tsconfig/#strictBindCallApply
[d28]: https://www.typescriptlang.org/tsconfig/#strictBuiltinIteratorReturn
[d29]: https://www.typescriptlang.org/tsconfig/#strictFunctionTypes
[d30]: https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
[d31]: https://www.typescriptlang.org/tsconfig/#strictPropertyInitialization
[d32]: https://www.typescriptlang.org/tsconfig/#strictNullChecks
[d33]: https://www.typescriptlang.org/tsconfig/#useDefineForClassFields
[d34]: https://www.typescriptlang.org/tsconfig/#rewriteRelativeImportExtensions
[d35]: https://www.typescriptlang.org/tsconfig/#allowImportingTsExtensions

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

## JSON schema

The JSON schema for `tsconfig.json` and `jsconfig.json` files are available at the [SchemaStore/schemastore](https://github.com/SchemaStore/schemastore) GitHub repo:

- https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/tsconfig.json
- https://github.com/SchemaStore/schemastore/blob/master/src/schemas/json/jsconfig.json

It's used by VS Code, and is updated by the community, sometimes by the TypeScript maintainers, but may also often be out-of-date. The [TypeScript-Website](https://github.com/microsoft/TypeScript-Website) GitHub repo also contains its own JSON schema generated from `typescript` itself and other hardcoded data, but is also often out-of-date:

- https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/scripts/schema/generateJSON.ts
- https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/scripts/schema/result/schema.json

Among this conundrum, the most reliable source of truth is still from [SchemaStore/schemastore](https://github.com/SchemaStore/schemastore).

> [!NOTE]
> The JSON schema could use some love modernizing to the latest JSON schema spec, deriving automatically from `typescript`'s own documentation (though some are missing), removing outdated fields, and adding missing fields (like [`compilerOptions.explainFiles`](https://www.typescriptlang.org/tsconfig/#explainFiles)).
>
> At the moment I've only written some simple scripts to do so [here](https://gist.github.com/bluwy/f776bc97c78cbbddada9390e6172fb30).

<!-- Also here but still private: https://github.com/bluwy/tsconfig-utils/blob/master/scripts/generate-tsconfig/get-tsconfig-schema.ts -->

Test how jsconfig.json interacts with tsconfig.json when searching a config for a file. This does not test `tsc` as it is known that it will only take `tsconfig.json` as the default.

- Open `jsconfig-base/nested/a.js`, notice that `jsconfig-base/nested/tsconfig.json` takes effect.
- Open `tsconfig-base/nested/a.js`, notice that `tsconfig-base/nested/jsconfig.json` takes effect.
- Open `both-base/a.js`, notice that `both-base/tsconfig.json` takes effect.

This means that both `tsconfig.json` and `jsconfig.json` are accounted for when searching for the nearest matching config. And if both is in the same directory, `tsconfig.json` takes precedence over `jsconfig.json`.

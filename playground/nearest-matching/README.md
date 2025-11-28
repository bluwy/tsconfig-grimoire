Test if `tsconfig.json` or `nested/tsconfig.json` is applied to `nested/*.ts` files.

- Open `nested/a.ts`. Notice that `TS7006: Parameter 'bar' implicitly has an 'any' type` is reported because the nearest matching `tsconfig.json` is the root one with `noImplicitAny` enabled.
- Open `nested/b.ts`. Notice that there are no errors, the IDE reads the nearest matching `tsconfig.json` which is `nested/tsconfig.json` that does not have `noImplicitAny` enabled.

Test which tsconfig file is applied to a file that's not included by its nearest tsconfig file, but is imported by another file that is included.

In `single` where there's only a single `tsconfig.json` that includes `src/main.ts`:

1. Open `single/src/imported.ts`, notice it's affected by `single/tsconfig.json` and reports `TS7006: Parameter 'bar' implicitly has an 'any' type`.
2. Run `npx tsc --noEmit`, notice that both `.ts` files are type-checked and compiled.

In `fallback` where there's a `tsconfig.json` in both the root and `src` folder:

1. Open `fallback/src/imported.ts`, notice it's affected by `fallback/src/tsconfig.json` and reports `TS7006: Parameter 'bar' implicitly has an 'any' type`.
2. In `src`, run `npx tsc --noEmit`, notice that both `.ts` files are type-checked and compiled.

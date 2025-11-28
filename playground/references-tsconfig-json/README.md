Test behavior of nested `tsconfig.json` files that happen to be part of a project reference structure. To see which `tsconfig.json` is respected.

- Run `npx tsc -b`. Notice that `a/a.ts` and `b/b.ts` are reported with `TS7006: Parameter 'bar' implicitly has an 'any' type`. However, `TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.` is not reported as configured in the root `tscondig.json`.
- Open `a/a.ts` and `b/b.ts`. Notice that there are no errors, the IDE respects the nearest matching `tsconfig.json` and does not continue searching upwards.

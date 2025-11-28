Test behavior of nested `tsconfig.json` files that happen to be part of a project reference structure (solution-style). To see which `tsconfig.json` is respected.

- Run `npx tsc -b --noEmit`. Notice that `a/a.ts` and `b/b.ts` are reported with `TS7006: Parameter 'bar' implicitly has an 'any' type`.
- Open `a/a.ts`. Notice that there are no errors, the IDE respects the nearest matching `tsconfig.json` and does not continue searching upwards even with `"composite": true` set in the nested tsconfig.
- Open `b/b.ts`. Notice the same as above, this time with `"composite"` not set to ensure that it doesn't matter.

Test behavior of `tsconfig.a.json` and `tsconfig.b.json` both including the `shared` directory via project references (solution-style).

- Run `npx tsc -b --noEmit`. Notice that `shared/shared.ts` is reported twice (because included by both tsconfigs).
- Open `shared/shared.ts`. Notice that `TS7006: Parameter 'bar' implicitly has an 'any' type` is not reported because the nearest matching tsconfig is `tsconfig.a.json` which does not have `noImplicitAny` enabled.

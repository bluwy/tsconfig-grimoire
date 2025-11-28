Test behavior of the root `tsconfig.json` referencing `tsconfig.a.json` and `tsconfig.b.json`, all including the `shared` directory. The root `tsconfig.json` also includes files in the `root` directory.

- Run `npx tsc -b`. Notice that `shared/shared.ts` is reported twice (because included by both `tsconfig.a.json` and `tsconfig.b.json`). However, even though the root `tsconfig.json` also includes it, it does not report it a third time.

  Also notice that `root/root.ts` is reported as it's included by the root `tsconfig.json`.

- Open `shared/shared.ts`. Notice that `TS2683: 'this' implicitly has type 'any' because it does not have a type annotation.` is reported because of the config in `tsconfig.a.json` which has `noImplicitThis` enabled.

---

In the IDE context, this means that if a file is included by a referenced tsconfig, that tsconfig's settings will be used for that file. If a file is not included by any referenced tsconfig, but included by the root tsconfig, then the root tsconfig's settings will be used.

In the `tsc -b` context, referenced tsconfigs are compiled and type-checked first, then the root tsconfig is compiled and type-checked, only including files that are not already included by the referenced tsconfigs.

This also means that both IDE and `tsc` have consistent behavior in the two search strategies.

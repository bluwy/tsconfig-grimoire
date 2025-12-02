Test if nested references work.

- Run `npx tsc --build --verbose`, notice that the nested `tsconfig.c.json` reports errors for `shared/shared.ts`, and the `tsconfig.b.json` (which references it) only reports error from `b/b.ts` because `shared/shared.ts` is already handled by `tsconfig.c.json`.

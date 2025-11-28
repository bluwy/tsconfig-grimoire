// This file is included by the root and referenced tsconfigs

// The root tsconfig `noImplicitAny` setting is not used, so no error here
export const foo = (bar) => bar

// This will be reported by both tsconfig.a.json and tsconfig.b.json for untyped global,
// but not reported by the root tsconfig.json
export const global = hmm

// The tsconfig.a.json `noImplicitThis` settings is used, so has error here
export const implicitThis = function () {
  return this
}

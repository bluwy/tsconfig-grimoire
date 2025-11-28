// This will only be reported by tsconfig.a.json for `noImplicitAny`
export const foo = (bar) => bar

// This will be reported by both tsconfig.a.json and tsconfig.b.json for untyped global
export const global = hmm

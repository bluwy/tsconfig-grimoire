const tsconfigLink = 'https://www.typescriptlang.org/tsconfig/'

async function main() {
  let table = '| Option | Default |\n| - | - |\n'
  let references: string[] = []

  function linkify(name: string) {
    const link = `${tsconfigLink}#${name}`
    let index = references.indexOf(link)
    if (index < 0) {
      references.push(link)
      index = references.length - 1
    }
    return `[\`${name}\`](d${index})`
  }

  for (const [option, defaultValue] of Object.entries(defaultsForOptions)) {
    let defaultStr = Array.isArray(defaultValue)
      ? defaultValue.join(' ')
      : defaultValue
    defaultStr = defaultStr.replace(/\[`(\w+?)`\]\(#[\w-]+?\)/g, (_, $1) =>
      linkify($1)
    )
    table += `| ${linkify(option)} | ${defaultStr} |\n`
  }

  // Pad option column
  const maxSecondPipeIndex = Math.max(
    ...table.split('\n').map((line) => line.indexOf('|', 2))
  )
  table = table
    .split('\n')
    .map((line, i) => {
      if (i <= 1) return line // Skip header and separator
      const secondPipeIndex = line.indexOf('|', 2)
      const padding = ' '.repeat(maxSecondPipeIndex - secondPipeIndex)
      return (
        line.slice(0, secondPipeIndex) + padding + line.slice(secondPipeIndex)
      )
    })
    .join('\n')

  let referencesStr = ''
  for (let i = 0; i < references.length; i++) {
    referencesStr += `[d${i}]: ${references[i]}\n`
  }

  console.log(table + '\n' + referencesStr)
}

// #region Defaults
// https://github.com/microsoft/TypeScript-Website/blob/5b2c0a7c557102f2b6aa1c736fbea94e9863d82e/packages/tsconfig-reference/scripts/tsconfigRules.ts#L196-L278

function trueIf(name: string) {
  return [`\`true\` if [\`${name}\`](#${name});`, '`false` otherwise.']
}

export const defaultsForOptions = {
  allowSyntheticDefaultImports: [
    '`true` if [`esModuleInterop`](#esModuleInterop) is enabled, [`module`](#module) is `system`, or [`moduleResolution`](#module-resolution) is `bundler`;',
    '`false` otherwise.',
  ],
  alwaysStrict: trueIf('strict'),
  declaration: trueIf('composite'),
  esModuleInterop: [
    '`true` if [`module`](#module) is `node16`, `nodenext`, or `preserve`;',
    '`false` otherwise.',
  ],
  exclude: [
    'node_modules',
    'bower_components',
    'jspm_packages',
    '[`outDir`](#outDir)',
  ],
  include: ['`[]` if [`files`](#files) is specified;', '`**/*` otherwise.'],
  incremental: trueIf('composite'),
  isolatedModules: trueIf('verbatimModuleSyntax'),
  jsxFactory: 'React.createElement',
  locale: 'Platform specific.',
  module: [
    '`CommonJS` if [`target`](#target) is `ES5`;',
    '`ES6`/`ES2015` otherwise.',
  ],
  moduleResolution: [
    '`Node10` if [`module`](#module) is `CommonJS`;',
    '`Node16` if [`module`](#module) is `Node16`, `Node18`, or `Node20`;',
    '`NodeNext` if [`module`](#module) is `NodeNext`;',
    '`Bundler` if [`module`](#module) is `Preserve`;',
    '`Classic` otherwise.',
  ],
  newLine: '`lf`',
  noImplicitAny: trueIf('strict'),
  noImplicitThis: trueIf('strict'),
  preserveConstEnums: trueIf('isolatedModules'),
  reactNamespace: 'React',
  resolvePackageJsonExports: [
    '`true` when [`moduleResolution`](#moduleResolution) is `node16`, `nodenext`, or `bundler`;',
    'otherwise `false`',
  ],
  resolvePackageJsonImports: [
    '`true` when [`moduleResolution`](#moduleResolution) is `node16`, `nodenext`, or `bundler`;',
    'otherwise `false`',
  ],
  rootDir: 'Computed from the list of input files.',
  rootDirs: 'Computed from the list of input files.',
  strictBindCallApply: trueIf('strict'),
  strictBuiltinIteratorReturn: trueIf('strict'),
  strictFunctionTypes: trueIf('strict'),
  useUnknownInCatchVariables: trueIf('strict'),
  strictPropertyInitialization: trueIf('strict'),
  strictNullChecks: trueIf('strict'),
  target: [
    '`es2023` if [`module`](#module) is `node20`;',
    '`esnext` if [`module`](#module) is `nodenext`;',
    '`ES5` otherwise.',
  ],
  useDefineForClassFields: [
    '`true` if [`target`](#target) is `ES2022` or higher, including `ESNext`;',
    '`false` otherwise.',
  ],
  allowImportingTsExtensions: trueIf('rewriteRelativeImportExtensions'),
}

// #endregion

await main()

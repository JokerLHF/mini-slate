import SlateCore from '../../packages/slate/package.json'
import SlateReact from '../../packages/slate-react/package.json'
import SlateHistory from '../../packages/slate-history/package.json'

import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

// https://zhuanlan.zhihu.com/p/221968604
function configure(pkg, env, target) {
  const isModule = target === 'module';
  const input = `packages/${pkg.name}/src/index.ts`;
  const deps = []
    .concat(pkg.dependencies ? Object.keys(pkg.dependencies) : [])
    .concat(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : [])

  // Stop Rollup from warning about circular dependencies.
  const onwarn = warning => {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      console.warn(`(!) ${warning.message}`) // eslint-disable-line no-console
    }
  }

  const plugins = [
    // Allow Rollup to resolve modules from `node_modules`, since it only
    // resolves local modules by default.
    resolve({
      browser: true,
    }),

    typescript({
      abortOnError: false,
      tsconfig: `./packages/${pkg.name}/tsconfig.json`,
      // COMPAT: Without this flag sometimes the declarations are not updated.
      // clean: isProd ? true : false,
      clean: true,
    }),

    // Allow Rollup to resolve CommonJS modules, since it only resolves ES2015
    // modules by default.
    commonjs({
      exclude: [`packages/${pkg.name}/src/**`],
      // HACK: Sometimes the CommonJS plugin can't identify named exports, so
      // we have to manually specify named exports here for them to work.
      // https://github.com/rollup/rollup-plugin-commonjs#custom-named-exports
      namedExports: {
        'react-dom': ['findDOMNode'],
        'react-dom/server': ['renderToStaticMarkup'],
      },
    }),

    // Convert JSON imports to ES6 modules.
    json(),

    // Replace `process.env.NODE_ENV` with its value, which enables some modules
    // like React and Slate to use their production variant.
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),


    // Use Babel to transpile the result, limiting it to the source code.
    babel({
      runtimeHelpers: true,
      include: [`packages/${pkg.name}/src/**`],
      extensions: ['.js', '.ts', '.tsx'],
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          {
            exclude: [
              '@babel/plugin-transform-regenerator',
              '@babel/transform-async-to-generator',
            ],
            modules: false,
            targets: {
              esmodules: isModule,
            },
          },
        ],
        '@babel/preset-react',
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            regenerator: false,
            useESModules: isModule,
          },
        ],
        '@babel/plugin-proposal-class-properties',
      ],
    }),
  ].filter(Boolean)

  return {
    plugins,
    input,
    onwarn,
    output: [
      {
        file: `packages/${pkg.name}/${pkg.module}`,
        format: 'es',
        sourcemap: true,
      },
    ],
    // We need to explicitly state which modules are external, meaning that
    // they are present at runtime. In the case of non-UMD configs, this means
    // all non-Slate packages.
    external: id => {
      return !!deps.find(dep => dep === id || id.startsWith(`${dep}/`))
    },
  }
}

function factory(pkg, options = {}) {
  return configure(pkg, 'development', 'module', options);
}

export default [
  factory(SlateReact),
  factory(SlateCore),
  factory(SlateHistory),
]

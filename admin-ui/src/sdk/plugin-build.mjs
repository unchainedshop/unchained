import { defineConfig } from 'tsup';

const SHARED_DEPS = {
  react: {
    default: ['default'],
    named: [
      'useState',
      'useEffect',
      'useCallback',
      'useRef',
      'useMemo',
      'useContext',
      'useReducer',
      'useLayoutEffect',
      'createContext',
      'createElement',
      'Fragment',
      'Component',
      'forwardRef',
      'memo',
      'lazy',
      'Suspense',
      'Children',
      'cloneElement',
      'isValidElement',
      'createRef',
      'StrictMode',
    ],
  },
  'react/jsx-runtime': {
    named: ['jsx', 'jsxs', 'Fragment'],
  },
  '@apollo/client': {
    named: ['gql', 'useQuery', 'useMutation', 'useLazyQuery', 'useApolloClient'],
  },
  '@apollo/client/react': {
    named: ['useQuery', 'useMutation', 'useLazyQuery', 'useApolloClient'],
  },
  'next/router': {
    named: ['useRouter'],
  },
  'react-intl': {
    named: ['useIntl', 'FormattedMessage', 'defineMessages'],
  },
  'react-toastify': {
    named: ['toast'],
  },
  'react-hook-form': {
    named: ['useForm', 'useFormContext', 'useController', 'useFieldArray', 'useWatch', 'FormProvider', 'Controller'],
  },
  '@unchainedshop/admin-ui/plugins': {
    named: ['usePluginRuntime'],
  },
};

function generateShim(specifier) {
  const config = SHARED_DEPS[specifier];
  if (!config) return '';

  const lines = [
    `var __dep = (typeof window !== 'undefined' && window.__UNCHAINED_PLUGIN_DEPS__) ? window.__UNCHAINED_PLUGIN_DEPS__[${JSON.stringify(specifier)}] : {};`,
  ];

  if (config.default) {
    lines.push(`export default __dep;`);
  }

  if (config.named) {
    for (const name of config.named) {
      lines.push(`export var ${name} = __dep.${name};`);
    }
  }

  return lines.join('\n');
}

export const unchainedPluginShims = () => ({
  name: 'unchained-plugin-shims',
  setup(build) {
    const shimmable = Object.keys(SHARED_DEPS);
    const filter = new RegExp(
      `^(${shimmable.map((s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})$`,
    );

    build.onResolve({ filter }, (args) => ({
      path: args.path,
      namespace: 'unchained-shim',
    }));

    build.onLoad({ filter: /.*/, namespace: 'unchained-shim' }, (args) => ({
      contents: generateShim(args.path),
      loader: 'js',
    }));
  },
});

export function definePluginConfig(pluginName, entry = 'src/index.tsx') {
  return defineConfig({
    entry: { index: entry },
    format: ['iife'],
    outDir: 'dist',
    outExtension: () => ({ js: '.global.js' }),
    dts: false,
    splitting: false,
    clean: true,
    globalName: '_pluginExports',
    footer: {
      js: `if(typeof window!=='undefined'){window.__UNCHAINED_PLUGINS__=window.__UNCHAINED_PLUGINS__||{};window.__UNCHAINED_PLUGINS__[${JSON.stringify(pluginName)}]=_pluginExports;}`,
    },
    esbuildPlugins: [unchainedPluginShims()],
  });
}

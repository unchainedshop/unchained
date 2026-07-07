import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';
import { SHARED_DEP_SHIMS } from './src/sdk/plugin-runtime.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_IDENT = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/;

async function generateShimSource(specifier: string): Promise<string> {
  let hasDefault = false;
  let named: string[] = [];

  let mod: Record<string, any> | null = null;
  try {
    mod = await import(specifier);
  } catch {
    // Some packages (e.g. next/router) need a .js extension in plain Node ESM
    try {
      mod = await import(specifier + '.js');
    } catch {
      // Fall through — try resolving the source file
    }
  }
  if (mod) {
    const allKeys = Object.keys(mod);
    hasDefault = allKeys.includes('default');
    named = allKeys.filter(
      (k) =>
        k !== 'default' &&
        k !== '__esModule' &&
        !k.startsWith('__') &&
        VALID_IDENT.test(k),
    );
  } else {
    // Last resort: resolve the package entry and extract exports from source
    try {
      const resolved = import.meta.resolve(specifier);
      const source = readFileSync(new URL(resolved).pathname, 'utf-8');
      const exportRe = /\bexport\s+(?:function|const|let|var|class)\s+([a-zA-Z$_][a-zA-Z0-9$_]*)/g;
      let m;
      while ((m = exportRe.exec(source)) !== null) {
        if (VALID_IDENT.test(m[1])) named.push(m[1]);
      }
      hasDefault = /\bexport\s+default\b/.test(source);
      if (named.length === 0 && !hasDefault) hasDefault = true;
    } catch {
      hasDefault = true;
    }
  }

  const lines = [
    `import { hostDep } from './host';`,
    `const dep = hostDep(${JSON.stringify(specifier)});`,
  ];

  if (hasDefault) {
    lines.push(`export default dep.default ?? dep;`);
  }

  for (const name of named) {
    lines.push(`export const ${name} = dep.${name};`);
  }

  return lines.join('\n');
}

const shimDir = resolve(__dirname, 'src/sdk/shims');

const specifierByPath = new Map(
  Object.entries(SHARED_DEP_SHIMS).map(([specifier, distFile]) => {
    const tsFile = distFile.replace('shims/', '').replace('.js', '.ts');
    return [resolve(shimDir, tsFile), specifier];
  }),
);

const shimEntries = Object.fromEntries(
  Object.entries(SHARED_DEP_SHIMS).map(([, distFile]) => {
    const key = distFile.replace('.js', '');
    const tsFile = distFile.replace('shims/', '').replace('.js', '.ts');
    return [key, `src/sdk/shims/${tsFile}`];
  }),
);

const shimPlugin = {
  name: 'unchained-shim-generator',
  setup(build: any) {
    build.onLoad(
      { filter: /src\/sdk\/shims\/.*\.ts$/ },
      async (args: any) => {
        const specifier = specifierByPath.get(args.path);
        if (!specifier) return undefined; // host.ts and unknown files pass through
        const contents = await generateShimSource(specifier);
        return { contents, loader: 'ts', resolveDir: shimDir };
      },
    );
  },
};

export default defineConfig({
  entry: {
    ui: 'src/components/ui/index.ts',
    form: 'src/components/ui/form/index.ts',
    hooks: 'src/sdk/hooks.ts',
    providers: 'src/sdk/providers.ts',
    modal: 'src/sdk/modal.ts',
    theme: 'src/sdk/theme.ts',
    plugins: 'src/sdk/plugins.ts',
    ...shimEntries,
    'modules/accounts': 'src/modules/accounts/index.ts',
    'modules/assortment': 'src/modules/assortment/index.ts',
    'modules/country': 'src/modules/country/index.ts',
    'modules/currency': 'src/modules/currency/index.ts',
    'modules/delivery-provider': 'src/modules/delivery-provider/index.ts',
    'modules/enrollment': 'src/modules/enrollment/index.ts',
    'modules/event': 'src/modules/event/index.ts',
    'modules/filter': 'src/modules/filter/index.ts',
    'modules/language': 'src/modules/language/index.ts',
    'modules/order': 'src/modules/order/index.ts',
    'modules/payment-providers': 'src/modules/payment-providers/index.ts',
    'modules/product': 'src/modules/product/index.ts',
    'modules/product-review': 'src/modules/product-review/index.ts',
    'modules/quotation': 'src/modules/quotation/index.ts',
    'modules/token': 'src/modules/token/index.ts',
    'modules/warehousing-providers':
      'src/modules/warehousing-providers/index.ts',
    'modules/work': 'src/modules/work/index.ts',
  },
  format: ['esm'],
  platform: 'browser',
  dts: false,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/link',
    'next/image',
    'next/router',
    'react-hook-form',
    '@apollo/client',
    '@apollo/client/react',
    'react-intl',
    'react-toastify',
  ],
  esbuildPlugins: [shimPlugin],
  esbuildOptions(options) {
    options.alias = {
      '@/*': './src/*',
    };
  },
});

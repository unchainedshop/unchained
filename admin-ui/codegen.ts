import type { CodegenConfig } from '@graphql-codegen/cli';

const sharedConfig = {
  typesPrefix: 'I',
  addDocBlocks: false,
  skipTypename: true,
  namingConvention: 'change-case-all#pascalCase',
  arrayInputCoercion: false,
};

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://localhost:4010/graphql',
  // UnchainedContextWrapper builds its fragment via runtime interpolation — not pluckable
  documents: [
    './src/modules/**/*.{ts,tsx}',
    '!./src/modules/UnchainedContext/UnchainedContextWrapper.tsx',
  ],
  generates: {
    './src/gql/schema-types.ts': {
      plugins: ['typescript'],
      config: sharedConfig,
    },
    './src/gql/operation-types.ts': {
      plugins: ['typescript-operations'],
      config: {
        ...sharedConfig,
        namespacedImportName: 'Types',
        importSchemaTypesFrom: './src/gql/schema-types.ts',
        withHooks: false,
        withMutationFn: false,
        withRefetchFn: false,
        withResultType: false,
        withMutationOptionsType: false,
        documentMode: 'external',
        experimentalFragmentVariables: true,
        dedupeOperationSuffix: true,
      },
    },
  },
};

export default config;

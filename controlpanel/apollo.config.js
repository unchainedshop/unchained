module.exports = {
  client: {
    name: 'Unchained Control Panel',
    service: {
      name: 'local',
      url: 'http://localhost:4010/graphql',
    },
  },
  service: {
    name: 'local',
    endpoint: {
      url: 'https://localhost:4000/graphql',
    },
    localSchemaFile: './schema.json',
  },
  queries: [
    {
      schema: 'local', // reference the previously defined schema
      includes: ['**/*.tsx'], // load queries from .tsx files
      excludes: ['node_modules/**'], // don't include any matching files from node_modules
    },
  ],
};

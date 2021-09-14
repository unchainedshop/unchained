module.exports = {
  client: {
    name: 'Unchained Admin UI',
    service: {
      name: 'local',
      url: 'http://localhost:4010/graphql',
    },
  },
  service: {
    name: 'local',
    endpoint: {
      url: 'http://localhost:4010/graphql',
    },
  },
  queries: [
    {
      schema: 'local', // reference the previously defined schema
      includes: ['**/*.tsx'], // load queries from .tsx files
      excludes: ['node_modules/**'], // don't include any matching files from node_modules
    },
  ],
};

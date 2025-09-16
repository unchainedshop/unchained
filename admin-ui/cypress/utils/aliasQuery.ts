export const aliasQuery = (req, alias) => {
  req.alias = `gql${alias}Query`;
};

export const fullAliasName = (alias) => {
  return `@gql${alias}Query`;
};

const Aliases = { aliasQuery, fullAliasName };

export default Aliases;

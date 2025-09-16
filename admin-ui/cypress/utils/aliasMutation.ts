export const aliasMutation = (req, alias) => {
  req.alias = `gql${alias}Mutation`;
};

export const fullAliasMutationName = (alias) => {
  return `@gql${alias}Mutation`;
};

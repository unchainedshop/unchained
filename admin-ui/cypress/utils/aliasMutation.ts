export const aliasMutation = (req, alias) => {
  req.alias = `gql${alias}Mutation`;
};

export const fullAliasMutationName = (alias): `@${string}` => {
  return `@gql${alias}Mutation`;
};

import { GraphQLScalarType, Kind } from 'graphql';

const LowerCase = (value: any) => {
  return value.toLowerCase();
};

const LowerCaseString = new GraphQLScalarType({
  name: 'LowerCaseString',
  description: 'Lowercased string',
  serialize: LowerCase,
  parseValue(value) {
    return String(value)?.toLowerCase();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value?.toLowerCase();
    }

    return null;
  },
});

export default LowerCaseString;

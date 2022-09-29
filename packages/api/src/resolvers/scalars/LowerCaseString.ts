import { GraphQLScalarType, Kind } from 'graphql';

const LowerCaseString = new GraphQLScalarType({
  name: 'LowerCaseString',
  description: 'Lowercased string',
  serialize: (value: any) => value?.toLowerCase(),
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

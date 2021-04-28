import { Kind } from 'graphql/language';

export default {
  __parseValue(value) {
    return Number(value);
  },
  __serialize(value) {
    return value;
  },

  __parseLiteral(ast) {
    if (
      ast.kind === Kind.INT ||
      ast.kind === Kind.FLOAT ||
      ast.kind === Kind.STRING
    ) {
      return Number(ast.value);
    }
    return null;
  },
};

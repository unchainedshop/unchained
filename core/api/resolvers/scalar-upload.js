export default {
  description: 'The `Upload` scalar type represents a file upload promise that resolves a buffer file object',
  __parseValue(value) {
    return value;
  },
  __serialize() {
    throw new Error('Upload scalar serialization unsupported');
  },
  __parseLiteral() {
    throw new Error('Upload scalar literal unsupported');
  },
};

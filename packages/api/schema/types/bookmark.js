export default [
  /* GraphQL */ `
    type Bookmark {
      _id: ID!
      user: User!
      product: Product!
      created: Date
    }
  `
];

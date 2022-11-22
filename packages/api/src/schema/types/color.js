export default [
  /* GraphQL */ `
    type Color @cacheControl(maxAge: 180) {
      name: String
      hex: String
      red: Int
      green: Int
      blue: Int
    }
  `,
];

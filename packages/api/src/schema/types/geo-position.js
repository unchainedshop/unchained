export default [
  /* GraphQL */ `
    type GeoPosition @cacheControl(maxAge: 180) {
      latitude: Float!
      longitude: Float!
      altitute: Float
    }
  `,
];

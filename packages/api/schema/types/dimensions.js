export default [
  /* GraphQL */ `
    enum MassUnit {
      KILOGRAM
      GRAM
      POUNDS
    }

    enum LengthUnit {
      METERS
      FEET
      MILLIMETERS
    }

    type Dimensions {
      weight(unit: MassUnit = KILOGRAM): Float
      length(unit: LengthUnit = METERS): Float
      width(unit: LengthUnit = METERS): Float
      height(unit: LengthUnit = METERS): Float
    }
  `
];

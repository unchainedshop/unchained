const ONE_FOOT_IN_MILLIMETERS = 304.8000000012192;
const ONE_POUND_IN_GRAM = 453.59237;

const MassUnit = {
  KILOGRAM: "KILOGRAM",
  GRAM: "GRAM",
  POUNDS: "POUNDS"
};

const LengthUnit = {
  METERS: "METERS",
  FEET: "FEET",
  MILLIMETERS: "MILLIMETERS"
};

export default {
  weight({ weightInGram = 0 }, { unit }) {
    if (unit === MassUnit.KILOGRAM) {
      return weightInGram / 1000;
    }
    if (unit === MassUnit.POUNDS) {
      return weightInGram / ONE_POUND_IN_GRAM;
    }
    return weightInGram;
  },
  length({ lengthInMillimeters = 0 }, { unit }) {
    if (unit === LengthUnit.METERS) {
      return lengthInMillimeters / 1000;
    }
    if (unit === LengthUnit.FEET) {
      return lengthInMillimeters / ONE_FOOT_IN_MILLIMETERS;
    }
    return lengthInMillimeters;
  },
  width({ widthInMillimeters = 0 }, { unit }) {
    if (unit === LengthUnit.METERS) {
      return widthInMillimeters / 1000;
    }
    if (unit === LengthUnit.FEET) {
      return widthInMillimeters / ONE_FOOT_IN_MILLIMETERS;
    }
    return widthInMillimeters;
  },
  height({ heightInMillimeters = 0 }, { unit }) {
    if (unit === LengthUnit.METERS) {
      return heightInMillimeters / 1000;
    }
    if (unit === LengthUnit.FEET) {
      return heightInMillimeters / ONE_FOOT_IN_MILLIMETERS;
    }
    return heightInMillimeters;
  }
};

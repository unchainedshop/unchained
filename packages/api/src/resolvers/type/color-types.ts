function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export const Color = {
  name({ colorName }) {
    return colorName;
  },
  hex({ colorHex }) {
    return colorHex;
  },
  red({ colorHex }) {
    const result = hexToRgb(colorHex);
    return result.r || 0;
  },
  green({ colorHex }) {
    const result = hexToRgb(colorHex);
    return result.g || 0;
  },
  blue({ colorHex }) {
    const result = hexToRgb(colorHex);
    return result.b || 0;
  },
};

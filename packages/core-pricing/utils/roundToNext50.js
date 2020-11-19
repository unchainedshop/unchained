function roundToNext50(x) {
  if (x % 50 === 25) {
    return x + 25;
  }
  return x + (50 - (x % 50));
}

export default roundToNext50;

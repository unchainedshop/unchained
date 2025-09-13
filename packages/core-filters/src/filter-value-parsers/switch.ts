export default (values: string[]): (string | undefined)[] => {
  const [stringifiedBoolean] = values; // drop all non index 0 values
  if (stringifiedBoolean === 'false' || stringifiedBoolean === '0') {
    return ['false'];
  }
  return ['true'];
};

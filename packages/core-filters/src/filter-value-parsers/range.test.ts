import range from './range.js';

describe('range', () => {
  it('returns an empty array if no range is provided', () => {
    const values = [];
    const allKeys = [];
    const result = range(values, allKeys);
    expect(result).toEqual([]);
  });

  it('returns an array with the start value if no end value is provided', () => {
    const values = ['1'];
    const allKeys = ['1', '2', '3'];
    const result = range(values, allKeys);
    expect(result).toEqual(['1']);
  });

  it('returns an array with all keys within the range of start and end values', () => {
    const values = ['1:3'];
    const allKeys = ['1', '2', '3', '4'];
    const result = range(values, allKeys);
    expect(result).toEqual(['1', '2', '3']);
  });
});

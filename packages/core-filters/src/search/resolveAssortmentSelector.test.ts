import { defaultSelector, resolveAssortmentSelector } from './resolveAssortmentSelector.js';

describe('defaultSelector', () => {
  it('returns an object with isActive key set to true if no query is provided', () => {
    const result = defaultSelector();
    expect(result).toEqual({ isActive: true });
  });

  it('returns an object with the isActive property set to true if the includeInactive property is not provided or is false', () => {
    const result1 = defaultSelector({});
    expect(result1).toEqual({ isActive: true });

    const result2 = defaultSelector({ includeInactive: false });
    expect(result2).toEqual({ isActive: true });
  });

  it('returns an empty object if the includeInactive property is true', () => {
    const result = defaultSelector({ includeInactive: true });
    expect(result).toEqual({});
  });
});

describe('resolveAssortmentSelector', () => {
  it('returns an object with isActive key set to true if no query is provided', () => {
    const result = resolveAssortmentSelector();
    expect(result).toEqual({ isActive: true });
  });

  it('returns an object with the isActive property set to true if the includeInactive property is not provided or is false', () => {
    const result1 = resolveAssortmentSelector({});
    expect(result1).toEqual({ isActive: true });

    const result2 = resolveAssortmentSelector({ includeInactive: false });
    expect(result2).toEqual({ isActive: true });
  });

  it('returns an empty object if the includeInactive property is true', () => {
    const result = resolveAssortmentSelector({ includeInactive: true });
    expect(result).toEqual({});
  });
});

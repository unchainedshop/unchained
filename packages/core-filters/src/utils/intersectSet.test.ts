import { intersectSet } from './intersectSet.js';

describe('intersectSet', () => {
  it('should return an empty set if the two input sets are empty', () => {
    const productIdSet: Set<string> = new Set();
    const filterProductIdSet: Set<string> = new Set();
    const result = intersectSet(productIdSet, filterProductIdSet);
    expect(result).toEqual(new Set());
  });

  it('should return an empty set if the two input sets do not have any common elements', () => {
    const productIdSet = new Set(['1', '2', '3']);
    const filterProductIdSet = new Set(['4', '5', '6']);
    const result = intersectSet(productIdSet, filterProductIdSet);
    expect(result).toEqual(new Set());
  });

  it('should return a set containing only the common elements of the two input sets', () => {
    const productIdSet = new Set(['1', '2', '3', '4']);
    const filterProductIdSet = new Set(['2', '3', '5', '6']);
    const result = intersectSet(productIdSet, filterProductIdSet);
    expect(result).toEqual(new Set(['2', '3']));
  });

  it('should not modify the original input sets', () => {
    const productIdSet = new Set(['1', '2', '3']);
    const filterProductIdSet = new Set(['2', '3', '4', '5']);
    intersectSet(productIdSet, filterProductIdSet);
    expect(productIdSet).toEqual(new Set(['1', '2', '3']));
    expect(filterProductIdSet).toEqual(new Set(['2', '3', '4', '5']));
  });
});

import { type Tree } from '@unchainedshop/utils';
import zipTreeByDeepness, {
  concatItemsByLevels,
  divideTreeByLevels,
  fillToSameLengthArray,
  fillUp,
} from './zipTreeByDeepness.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('divideTreeByLevels', () => {
  it('should return the expected result', () => {
    const array: Tree<string> = ['a', ['b', ['c', 'd']], 'e'];
    const expected = [
      {
        level: 0,
        items: ['a', 'e'],
      },
      {
        level: 1,
        items: ['b'],
      },
      {
        level: 2,
        items: ['c', 'd'],
      },
    ];

    assert.deepStrictEqual(divideTreeByLevels(array), expected);
  });

  it('should handle multiple sub-arrays at the same level in left-to-right order', () => {
    const array: Tree<string> = ['root', ['a1', ['deep-a']], ['b1', ['deep-b']]];
    const result = divideTreeByLevels(array);

    assert.deepStrictEqual(result, [
      { level: 0, items: ['root'] },
      { level: 1, items: ['a1'] },
      { level: 2, items: ['deep-a'] },
      { level: 1, items: ['b1'] },
      { level: 2, items: ['deep-b'] },
    ]);
  });

  it('should handle flat array with no nesting', () => {
    const array: Tree<string> = ['a', 'b', 'c'];
    assert.deepStrictEqual(divideTreeByLevels(array), [{ level: 0, items: ['a', 'b', 'c'] }]);
  });

  it('should handle empty array', () => {
    assert.deepStrictEqual(divideTreeByLevels([]), []);
  });

  it('should handle deeply nested single-element chains', () => {
    const array: Tree<string> = ['a', [['b', [['c']]]]];
    const result = divideTreeByLevels(array);

    assert.deepStrictEqual(result, [
      { level: 0, items: ['a'] },
      { level: 2, items: ['b'] },
      { level: 4, items: ['c'] },
    ]);
  });

  it('should handle sub-arrays with only nested children and no strings', () => {
    const array: Tree<string> = [['a'], ['b']];
    const result = divideTreeByLevels(array);

    assert.deepStrictEqual(result, [
      { level: 1, items: ['a'] },
      { level: 1, items: ['b'] },
    ]);
  });

  it('should not overflow on a very deep tree', () => {
    // Build a tree 20,000 levels deep — would overflow with recursive implementation
    let tree: Tree<string> = ['leaf'];
    for (let i = 0; i < 20_000; i++) {
      tree = [tree];
    }

    const result = divideTreeByLevels(tree);
    assert.equal(result.length, 1);
    assert.equal(result[0].level, 20_000);
    assert.deepStrictEqual(result[0].items, ['leaf']);
  });

  it('should not overflow on a very wide tree', () => {
    // 10,000 sub-arrays each with one string
    const array: Tree<string> = Array.from({ length: 10_000 }, (_, i) => [`item-${i}`]);
    const result = divideTreeByLevels(array);

    assert.equal(result.length, 10_000);
    assert.ok(result.every((r) => r.level === 1));
    assert.deepStrictEqual(result[0].items, ['item-0']);
    assert.deepStrictEqual(result[9999].items, ['item-9999']);
  });
});

describe('zipTreeByDeepness (full pipeline)', () => {
  it('should produce consistent output for a branching tree', () => {
    // Two branches at level 1, each with their own products at level 2
    const tree: Tree<string> = ['root', ['branch-a', ['a1', 'a2']], ['branch-b', ['b1', 'b2']]];
    const result = zipTreeByDeepness(tree);

    // All items should be present
    const allItems = ['root', 'branch-a', 'a1', 'a2', 'branch-b', 'b1', 'b2'];
    assert.deepStrictEqual(result.toSorted(), allItems.toSorted());
  });

  it('should handle a flat array', () => {
    const tree: Tree<string> = ['a', 'b', 'c'];
    const result = zipTreeByDeepness(tree);
    assert.deepStrictEqual(result, ['a', 'b', 'c']);
  });

  it('should handle an empty array', () => {
    const result = zipTreeByDeepness([]);
    assert.deepStrictEqual(result, []);
  });

  it('should preserve level order: an assortment own products come before descendants', () => {
    // Regression: an iterative flatten must keep level 0 (own products) first,
    // then level 1 (child), then level 2 (grandchild). A stack seeded without
    // reversing inverts the levels and pushes own products behind descendants.
    const tree: Tree<string> = ['root-p1', 'root-p2', ['child-p1', 'child-p2', ['grandchild-p1']]];
    const result = zipTreeByDeepness(tree);

    assert.deepStrictEqual(result, ['root-p1', 'root-p2', 'child-p1', 'child-p2', 'grandchild-p1']);
  });

  it('should keep sibling branches in left-to-right order', () => {
    const tree: Tree<string> = ['root', ['branch-a', ['a1', 'a2']], ['branch-b', ['b1', 'b2']]];
    const result = zipTreeByDeepness(tree);

    // Level order is preserved (0 before 1 before 2); within a level the
    // sibling branches are interleaved by the zip step (a1,b1 then a2,b2).
    assert.deepStrictEqual(result, ['root', 'branch-a', 'branch-b', 'a1', 'b1', 'a2', 'b2']);
  });

  it('should not overflow on a very deep tree', () => {
    // Build a tree ~5,000 levels deep. shuffleEachLevel nests the shuffled
    // items roughly as deep as the number of levels, which overflows the
    // recursive Array.prototype.flat(Infinity) this function replaced.
    let tree: Tree<string> = ['leaf'];
    for (let i = 0; i < 5_000; i++) {
      tree = [`p${i}`, tree];
    }

    assert.doesNotThrow(() => zipTreeByDeepness(tree));
    const result = zipTreeByDeepness(tree);
    assert.ok(result.includes('leaf'));
    assert.ok(result.includes('p0'));
  });
});

describe('fillUp', () => {
  it('should fill empty spaces with null based on the passed size parameter', () => {
    const arr = [1, 2, 3];
    const size = 5;

    const result = fillUp(arr, size);

    assert.deepStrictEqual(result, [1, 2, 3, null, null]);
  });
});

describe('fillToSameLengthArray', () => {
  it('should fill missing value place with null', () => {
    const a = [1, 2, 3];
    const b = [4, 5];

    const result = fillToSameLengthArray(a, b);

    assert.deepStrictEqual(result, [
      [1, 2, 3],
      [4, 5, null],
    ]);
  });
});

describe('concatItemsByLevels', () => {
  it('should concatenate the array and create array with length 2', () => {
    const levelArray = [
      { level: 1, items: ['a', 'b'] },
      { level: 2, items: ['c', 'd'] },
      { level: 1, items: ['e', 'f'] },
    ];
    const result = concatItemsByLevels(levelArray);
    assert.equal(result.length, 2);
  });
});

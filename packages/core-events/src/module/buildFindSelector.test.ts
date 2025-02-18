import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildFindSelector } from './configureEventsModule.js';

describe('buildFindSelector', () => {
  it('Return correct filter object when passed create, queryString, types', () => {
    assert.deepStrictEqual(
      buildFindSelector({
        created: new Date('2022-12-03T18:23:38.278Z'),
        queryString: 'Hello world',
        types: ['PRODUCT_CREATED'],
      }),
      {
        type: { $in: ['PRODUCT_CREATED'] },
        $text: { $search: 'Hello world' },
        created: { $gte: new Date('2022-12-03T18:23:38.278Z') },
      },
    );
  });

  it('Return correct filter object when passed create, queryString', () => {
    assert.deepStrictEqual(
      buildFindSelector({ created: new Date('2022-12-03T18:23:38.278Z'), queryString: 'Hello world' }),
      {
        $text: { $search: 'Hello world' },
        created: { $gte: new Date('2022-12-03T18:23:38.278Z') },
      },
    );
  });

  it('Return correct filter object when passed create', () => {
    assert.deepStrictEqual(buildFindSelector({ created: new Date('2022-12-03T18:23:38.278Z') }), {
      created: { $gte: new Date('2022-12-03T18:23:38.278Z') },
    });
  });

  it('Return correct filter object when passed no argument', () => {
    assert.deepStrictEqual(buildFindSelector({}), {});
  });
});

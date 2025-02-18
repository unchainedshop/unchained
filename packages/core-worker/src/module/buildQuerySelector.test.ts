import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WorkStatus } from '../worker-index.js';
import { buildQuerySelector } from './configureWorkerModule.js';

describe('Worker', () => {
  describe('buildQuerySelector', () => {
    it('Return correct filter object when passed no argument', () => {
      assert.deepStrictEqual(buildQuerySelector({}), { deleted: { $exists: false } });
    });

    it('Return correct filter object when passed create, queryString, scheduled, status, types & workId', () => {
      const selector = buildQuerySelector({
        created: {
          start: new Date('2022-12-04T17:13:09.285Z'),
          end: new Date('2022-12-04T17:13:09.285Z'),
        },
        queryString: 'hello world',
        scheduled: {
          end: new Date('2022-12-04T17:13:09.285Z'),
          start: new Date('2022-12-04T17:13:09.285Z'),
        },
        status: [WorkStatus.ALLOCATED],
        types: ['EMAIL'],
        workId: 'work-id',
      });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        $or: [
          {
            started: { $exists: true },
            finished: { $exists: false },
            deleted: { $exists: false },
          },
        ],
        created: {
          $gte: new Date('2022-12-04T17:13:09.285Z'),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
        scheduled: {
          $gte: new Date('2022-12-04T17:13:09.285Z'),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
        type: { $in: ['EMAIL'] },
        $text: { $search: 'hello world' },
      });
    });

    it('Return correct filter object when passed queryString, scheduled, status, types & workId', () => {
      const selector = buildQuerySelector({
        queryString: 'hello world',
        scheduled: {
          end: new Date('2022-12-04T17:13:09.285Z'),
          start: new Date('2022-12-04T17:13:09.285Z'),
        },
        status: [WorkStatus.ALLOCATED],
        types: ['EMAIL'],
        workId: 'work-id',
      });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        $or: [
          {
            started: { $exists: true },
            finished: { $exists: false },
            deleted: { $exists: false },
          },
        ],
        scheduled: {
          $gte: new Date('2022-12-04T17:13:09.285Z'),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
        type: { $in: ['EMAIL'] },
        $text: { $search: 'hello world' },
      });
    });

    it('Return correct filter object when passed scheduled, status, types & workId', () => {
      const selector = buildQuerySelector({
        scheduled: {
          end: new Date('2022-12-04T17:13:09.285Z'),
          start: new Date('2022-12-04T17:13:09.285Z'),
        },
        status: [WorkStatus.ALLOCATED],
        types: ['EMAIL'],
        workId: 'work-id',
      });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        $or: [
          {
            started: { $exists: true },
            finished: { $exists: false },
            deleted: { $exists: false },
          },
        ],
        scheduled: {
          $gte: new Date('2022-12-04T17:13:09.285Z'),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
        type: { $in: ['EMAIL'] },
      });
    });

    it('Return correct filter object when passed status, types & workId', () => {
      const selector = buildQuerySelector({
        status: [WorkStatus.ALLOCATED],
        types: ['EMAIL'],
        workId: 'work-id',
      });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        $or: [
          {
            started: { $exists: true },
            finished: { $exists: false },
            deleted: { $exists: false },
          },
        ],
        type: { $in: ['EMAIL'] },
      });
    });

    it('Return correct filter object when passed types & workId', () => {
      const selector = buildQuerySelector({ types: ['EMAIL'], workId: 'work-id' });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
        type: { $in: ['EMAIL'] },
      });
    });

    it('Return correct filter object when passed workId', () => {
      const selector = buildQuerySelector({ workId: 'work-id' });
      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
      });
    });

    it('Create start should be set to start of unix timestamp if created.start not provided', () => {
      const selector = buildQuerySelector({
        workId: 'work-id',
        created: { end: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
        created: {
          $gte: new Date(0),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
      });
    });

    it('Create start should be set to start or unix timestamp if created.end not provided', () => {
      const selector = buildQuerySelector({
        workId: 'work-id',
        created: { start: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
        created: { $gte: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(buildQuerySelector({ workId: 'work-id', created: {} }), {
        _id: 'work-id',
        deleted: { $exists: false },
        created: { $gte: new Date(0) },
      });
    });

    it('scheduled start should be set to start of unix timestamp if scheduled.start not provided', () => {
      const selector = buildQuerySelector({
        workId: 'work-id',
        scheduled: { end: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
        scheduled: {
          $gte: new Date(0),
          $lte: new Date('2022-12-04T17:13:09.285Z'),
        },
      });
    });

    it('Scheduled start should be set to start or unix timestamp if scheduled.end not provided', () => {
      const selector = buildQuerySelector({
        workId: 'work-id',
        scheduled: { start: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(selector, {
        _id: 'work-id',
        deleted: { $exists: false },
        scheduled: { $gte: new Date('2022-12-04T17:13:09.285Z') },
      });

      assert.deepStrictEqual(buildQuerySelector({ workId: 'work-id', scheduled: {} }), {
        _id: 'work-id',
        deleted: { $exists: false },
        scheduled: { $gte: new Date(0) },
      });
    });
  });
});

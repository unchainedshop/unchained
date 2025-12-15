import { describe, it } from 'node:test';
import { buildFindSelector } from './configureAssortmentsModule.ts';
import assert from 'node:assert';

describe('buildFindSelector', () => {
  it('Return the correct filter when passed no argument', () => {
    const result = buildFindSelector({});
    // With no arguments: isRoot=true (because includeLeaves defaults to false)
    // and isActive=true (because includeInactive defaults to false)
    // and deleted IS NULL
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('is_root = 1'));
    assert.ok(result.where.includes('is_active = 1'));
    assert.deepStrictEqual(result.params, []);
  });

  it('Return the correct filter when passed queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs, tags', () => {
    const result = buildFindSelector({
      queryString: 'hello world',
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
      includeInactive: true,
      includeLeaves: true,
      slugs: ['assortment-slug-1', 'assortment-slug-2'],
      tags: ['assortment-tag'],
    });
    // Should have deleted IS NULL
    assert.ok(result.where.includes('deleted IS NULL'));
    // Should have _id IN for assortmentIds
    assert.ok(result.where.includes('_id IN (?, ?)'));
    // Should have slugs check via json_each
    assert.ok(result.where.includes("json_each(json_extract(data, '$.slugs'))"));
    // Should have tags check via json_each
    assert.ok(result.where.includes("json_each(json_extract(data, '$.tags'))"));
    // Should have FTS match for queryString
    assert.ok(result.where.includes('assortments_fts MATCH'));
    // Should have sequence from assortmentSelector
    assert.ok(result.where.includes('sequence = ?'));
    // Params should include all values
    assert.ok(result.params.includes('assortment-1'));
    assert.ok(result.params.includes('assortment-2'));
    assert.ok(result.params.includes('assortment-slug-1'));
    assert.ok(result.params.includes('assortment-slug-2'));
    assert.ok(result.params.includes('assortment-tag'));
    assert.ok(result.params.includes('"hello world"'));
    assert.ok(result.params.includes(1));
  });

  it('Return the correct filter when passed queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves, slugs', () => {
    const result = buildFindSelector({
      queryString: 'hello world',
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
      includeInactive: true,
      includeLeaves: true,
      slugs: ['assortment-slug-1', 'assortment-slug-2'],
    });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('_id IN (?, ?)'));
    assert.ok(result.where.includes("json_each(json_extract(data, '$.slugs'))"));
    assert.ok(result.where.includes('assortments_fts MATCH'));
    // No tags check since tags not passed
    assert.ok(!result.where.includes("json_each(json_extract(data, '$.tags'))"));
  });

  it('Return the correct filter when passed queryString, assortmentId, assortmentSelector, includeInactive, includeLeaves', () => {
    const result = buildFindSelector({
      queryString: 'hello world',
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
      includeInactive: true,
      includeLeaves: true,
    });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('_id IN (?, ?)'));
    assert.ok(result.where.includes('assortments_fts MATCH'));
    // No slugs or tags
    assert.ok(!result.where.includes("json_each(json_extract(data, '$.slugs'))"));
    assert.ok(!result.where.includes("json_each(json_extract(data, '$.tags'))"));
  });

  it('Return the correct filter when passed queryString, assortmentId, assortmentSelector, includeInactive', () => {
    const result = buildFindSelector({
      queryString: 'hello world',
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
      includeInactive: true,
    });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('_id IN (?, ?)'));
    // includeLeaves defaults to false, but assortmentSelector is present so isRoot is not added
    assert.ok(!result.where.includes('is_root'));
    // includeInactive is true so is_active is not added
    assert.ok(!result.where.includes('is_active'));
  });

  it('Return the correct filter when passed queryString, assortmentId, assortmentSelector', () => {
    const result = buildFindSelector({
      queryString: 'hello world',
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
    });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('_id IN (?, ?)'));
    assert.ok(result.where.includes('assortments_fts MATCH'));
  });

  it('Return the correct filter when passed assortmentId, assortmentSelector', () => {
    const result = buildFindSelector({
      assortmentIds: ['assortment-1', 'assortment-2'],
      assortmentSelector: { sequence: 1 },
    });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('_id IN (?, ?)'));
    assert.ok(result.where.includes('sequence = ?'));
    assert.ok(result.params.includes('assortment-1'));
    assert.ok(result.params.includes('assortment-2'));
    assert.ok(result.params.includes(1));
  });

  it('Return the correct filter when passed assortmentSelector', () => {
    const result = buildFindSelector({ assortmentSelector: { sequence: 1 } });
    assert.ok(result.where.includes('deleted IS NULL'));
    assert.ok(result.where.includes('sequence = ?'));
    assert.ok(result.params.includes(1));
  });
});

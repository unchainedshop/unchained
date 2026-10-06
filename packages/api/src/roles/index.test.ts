import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allRoles, configureRoles, getConfiguredRoles, snapshotConfiguredRoles } from './index.ts';

describe('snapshotConfiguredRoles', () => {
  it('returns a function restoring the configured roles and allRoles', () => {
    const restoreBefore = snapshotConfiguredRoles();
    const platformRoles = configureRoles({});

    const restore = snapshotConfiguredRoles();
    const testRoles = configureRoles({ additionalRoles: { tester: () => undefined } });
    assert.equal(getConfiguredRoles(), testRoles);
    assert.ok(allRoles.tester);
    restore();

    assert.equal(getConfiguredRoles(), platformRoles);
    assert.equal(allRoles.ALL, platformRoles.allRole);
    assert.equal(allRoles.tester, undefined);
    restoreBefore();
  });
});

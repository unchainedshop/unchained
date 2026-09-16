import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPluginPageRedirect } from '../modules/Auth/permissionConfig.ts';

test('plugin pages require authentication unless explicitly public', () => {
  for (const viewer of [undefined, { _id: 'guest', isGuest: true }]) {
    assert.equal(getPluginPageRedirect(viewer, {}), '/log-in');
    assert.equal(
      getPluginPageRedirect(viewer, { publicAccess: false }),
      '/log-in',
    );
    assert.equal(getPluginPageRedirect(viewer, { publicAccess: true }), null);
    assert.equal(
      getPluginPageRedirect(viewer, {
        publicAccess: true,
        requiredRole: 'manageProducts',
      }),
      '/log-in',
    );
  }
  const user = { _id: 'staff', allowedActions: ['manageProducts'] };
  assert.equal(getPluginPageRedirect(user, {}), null);
  assert.equal(
    getPluginPageRedirect(user, { requiredRole: 'manageProducts' }),
    null,
  );
  assert.equal(
    getPluginPageRedirect(user, { requiredRole: 'manageUsers' }),
    '/403',
  );
});

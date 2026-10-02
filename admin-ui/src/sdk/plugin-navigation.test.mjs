import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPluginNavigation } from '../modules/plugins/pluginNavigation.ts';

const icon = (name) => name;

test('plugins with the same navigation label share one group', () => {
  const nav = buildPluginNavigation(
    [
      {
        name: 'ticketing',
        navigation: { label: 'Ticketing', icon: 'ticket', sortOrder: 90 },
        slots: {
          entities: [{ path: '/ticketing', label: 'Events', sortOrder: 90 }],
          pages: [{ path: '/gate-control', label: 'Gate Control', sortOrder: 92 }],
        },
      },
      {
        name: 'shop',
        navigation: { label: 'Ticketing', icon: 'tag', sortOrder: 95 },
        slots: {
          entities: [{ path: '/promo-codes', label: 'Promo codes', sortOrder: 91 }],
        },
      },
    ],
    icon,
  );
  assert.equal(nav.length, 1);
  assert.equal(nav[0].name, 'Ticketing');
  assert.equal(nav[0].icon, 'ticket');
  assert.equal(nav[0]._sortOrder, 90);
  assert.deepEqual(
    nav[0].children.map(({ href }) => href),
    ['/ext/ticketing', '/ext/promo-codes', '/ext/gate-control'],
  );
});

test('a group role applies only if every plugin of the group sets it', () => {
  const manifest = (requiredRole) => ({
    navigation: { label: 'Group', requiredRole },
    slots: { pages: [{ path: `/${requiredRole}`, label: String(requiredRole) }] },
  });
  assert.equal(buildPluginNavigation([manifest('a'), manifest('a')], icon)[0].requiredRole, 'a');
  assert.equal(buildPluginNavigation([manifest('a'), manifest('b')], icon)[0].requiredRole, undefined);
  assert.equal(buildPluginNavigation([manifest('a'), manifest()], icon)[0].requiredRole, undefined);
});

test('plugins without navigation add their entries at the top level', () => {
  const nav = buildPluginNavigation(
    [
      { slots: { pages: [{ path: 'reports', label: 'Reports', sortOrder: 5 }] } },
      { navigation: { label: 'Empty' }, slots: {} },
    ],
    icon,
  );
  assert.deepEqual(nav, [
    { name: 'Reports', icon: undefined, href: '/ext/reports', requiredRole: undefined, _sortOrder: 5 },
  ]);
});

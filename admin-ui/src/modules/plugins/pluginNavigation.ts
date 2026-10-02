// Sidebar entries of the plugin manifests. Plugins with the same navigation label share one
// group, so a project plugin can add its pages to the group of another plugin (for example the
// "Ticketing" group of @unchainedshop/ticketing) while its components stay in its own bundle.

interface PluginNavSlot {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
  sortOrder?: number;
}

export interface PluginNavManifest {
  navigation?: {
    label: string;
    icon?: string;
    requiredRole?: string;
    sortOrder?: number;
  };
  slots: {
    entities?: PluginNavSlot[];
    pages?: PluginNavSlot[];
    [slotId: string]: any;
  };
}

export interface PluginNavItem<Icon> {
  name: string;
  icon?: Icon;
  href?: string;
  requiredRole?: string;
  _sortOrder?: number;
  children?: PluginNavItem<Icon>[];
}

// Entries with a sortOrder first, in that order; the others keep their position
export const compareSortOrder = (
  a: { _sortOrder?: number },
  b: { _sortOrder?: number },
) => {
  const aOrder = a?._sortOrder;
  const bOrder = b?._sortOrder;
  if (aOrder != null && bOrder != null) return aOrder - bOrder;
  if (aOrder != null) return -1;
  if (bOrder != null) return 1;
  return 0;
};

export function buildPluginNavigation<Icon>(
  manifests: PluginNavManifest[],
  resolveIcon: (name?: string) => Icon,
): PluginNavItem<Icon>[] {
  const items: PluginNavItem<Icon>[] = [];
  const groups = new Map<
    string,
    PluginNavItem<Icon> & { _requiredRoles: (string | undefined)[] }
  >();

  for (const manifest of manifests) {
    const children: PluginNavItem<Icon>[] = [
      ...(manifest.slots?.entities || []),
      ...(manifest.slots?.pages || []),
    ].map((slot) => ({
      name: slot.label,
      icon: resolveIcon(slot.icon),
      href: `/ext/${slot.path.replace(/^\//, '')}`,
      requiredRole: slot.requiredRole,
      _sortOrder: slot.sortOrder,
    }));
    if (children.length === 0) continue;

    const nav = manifest.navigation;
    if (!nav) {
      items.push(...children);
      continue;
    }

    const group = groups.get(nav.label);
    if (!group) {
      const newGroup = {
        name: nav.label,
        icon: resolveIcon(nav.icon),
        _sortOrder: nav.sortOrder,
        children,
        _requiredRoles: [nav.requiredRole],
      };
      groups.set(nav.label, newGroup);
      items.push(newGroup);
      continue;
    }
    group.children.push(...children);
    group._requiredRoles.push(nav.requiredRole);
    if (
      nav.sortOrder != null &&
      (group._sortOrder == null || nav.sortOrder < group._sortOrder)
    ) {
      group._sortOrder = nav.sortOrder;
    }
  }

  return items.map((item) => {
    if (!('_requiredRoles' in item)) return item;
    const { _requiredRoles, children, ...group } =
      item as PluginNavItem<Icon> & {
        _requiredRoles: (string | undefined)[];
      };
    // A group role only applies if every plugin of the group asks for it
    const requiredRole = _requiredRoles.every(
      (role) => role && role === _requiredRoles[0],
    )
      ? _requiredRoles[0]
      : undefined;
    return {
      ...group,
      requiredRole,
      children: [...children].sort(compareSortOrder),
    };
  });
}

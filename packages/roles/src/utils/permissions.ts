export const permissions = async (userRoles: any, allRoles: any) => {
  const actions = userRoles?.flatMap((role) => {
    const foundRole: any = Object.values(allRoles).find((r: any) => r.name === role);
    if (!foundRole) return [];
    return Object.entries(foundRole.allowRules || {}).flatMap(([roleName, funcs]: any) => {
      return funcs.map(async (f) => {
        try {
          // return permissions that are by default activated for that role,
          // accidentally don't check context
          const r = await f(null, null, null);
          if (r) return roleName;
          return null;
        } catch {
          return null;
        }
      });
    });
  });
  const resolvedActions = await Promise.all(actions);
  return [...new Set(resolvedActions)].filter(Boolean).sort((a: any, b: any) => a.localeCompare(b));
};

export const permissions = async (userRoles: any, allRoles: any) => {
  const roleMap = new Map<string, any>();
  for (const r of Object.values(allRoles) as any[]) {
    roleMap.set(r.name, r);
  }

  const actions: Promise<string | null>[] = [];
  for (const role of userRoles || []) {
    const foundRole = roleMap.get(role);
    if (!foundRole) continue;
    for (const [roleName, funcs] of Object.entries(foundRole.allowRules || {})) {
      for (const f of funcs as any[]) {
        actions.push(
          (async () => {
            try {
              const r = await f(null, null, null);
              if (r) return roleName;
              return null;
            } catch {
              return null;
            }
          })(),
        );
      }
    }
  }

  const resolvedActions = await Promise.all(actions);
  return [...new Set(resolvedActions)].filter(Boolean).toSorted((a: any, b: any) => a.localeCompare(b));
};

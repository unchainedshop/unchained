export const permissions = async (userRoles: any, allRoles: any) => {
  const rolesByName = new Map<string, any>();
  for (const r of Object.values(allRoles) as any[]) {
    if (r?.name) rolesByName.set(r.name, r);
  }

  const result: string[] = [];
  const seen = new Set<string>();

  for (const role of userRoles || []) {
    const foundRole = rolesByName.get(role);
    if (!foundRole) continue;
    for (const [actionName, funcs] of Object.entries(foundRole.allowRules || {}) as any) {
      if (seen.has(actionName)) continue;
      for (const f of funcs) {
        try {
          if (await f(null, null, null)) {
            seen.add(actionName);
            result.push(actionName);
            break;
          }
        } catch {
          // Permission function threw — treat as denied
        }
      }
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
};

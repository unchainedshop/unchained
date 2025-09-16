const loadRoleConfigFromInjectedGlobalScript = () => {
  if (typeof window === 'undefined' || !(window as any)?.AdminUiPermissions) {
    return {};
  }
  return (window as any).AdminUiPermissions();
};

export default loadRoleConfigFromInjectedGlobalScript;

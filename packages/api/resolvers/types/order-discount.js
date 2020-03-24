export default {
  interface(obj) {
    const Interface = obj.interface()?.constructor;
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: Interface.isManualAdditionAllowed(),
      isManualRemovalAllowed: Interface.isManualRemovalAllowed()
    };
  }
};

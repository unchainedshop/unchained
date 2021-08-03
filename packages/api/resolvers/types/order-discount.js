import crypto from 'crypto';

export default {
  interface(obj) {
    const Interface = obj.interface()?.constructor;
    if (!Interface) return null;
    return {
      _id: Interface.key,
      label: Interface.label,
      version: Interface.version,
      isManualAdditionAllowed: Interface.isManualAdditionAllowed(),
      isManualRemovalAllowed: Interface.isManualRemovalAllowed(),
    };
  },

  total(obj) {
    const { total } = obj;
    if (total) {
      return {
        _id: crypto
          .createHash('sha256')
          .update([`${obj._id}`, total.amount, total.currency].join(''))
          .digest('hex'),
        amount: total.amount,
        currency: total.currency,
      };
    }
    return null;
  },
};

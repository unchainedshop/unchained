const settings = {
  ensureUserHasCart: null,
  load({ ensureUserHasCart = false } = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
  },
};

export default settings;

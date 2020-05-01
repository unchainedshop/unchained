const sortByCreationDate = () => (left, right) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const settings = {
  sortProviders: null,
  load({ sortProviders = sortByCreationDate } = {}) {
    this.sortProviders = sortProviders;
  },
};

export default settings;

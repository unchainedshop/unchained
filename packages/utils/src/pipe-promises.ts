export default (fns) => (initialValue) =>
  fns.reduce((sum, fn) => Promise.resolve(sum).then(fn), initialValue);

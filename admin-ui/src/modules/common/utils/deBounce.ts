const deBounce =
  (ms: number = 500) =>
  (func: Function) => {
    let timeout;
    return (...args) => {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), ms);
    };
  };

export default deBounce;

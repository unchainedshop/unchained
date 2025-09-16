const convertURLSearchParamToObj = (queryString) => {
  return Object.fromEntries(new URLSearchParams(queryString));
};

export default convertURLSearchParamToObj;

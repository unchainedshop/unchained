const convertArrayOfObjectToObject = (arr, label, key) =>
  Object.assign(
    {},
    ...(arr?.map((item) => ({ [item[key]]: item[label] })) || []),
  );

export default convertArrayOfObjectToObject;

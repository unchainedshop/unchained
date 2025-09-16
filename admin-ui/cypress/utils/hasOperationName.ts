const hasOperationName = (req, operationName) => {
  const { body } = req;
  return body?.operationName && body.operationName === operationName;
};

export default hasOperationName;

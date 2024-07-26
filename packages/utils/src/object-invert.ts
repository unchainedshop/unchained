const invertMapObject = (theMapObject: Record<string, string>): Record<string, string> =>
  Object.keys(theMapObject).reduce((invertedObj, key) => {
    const newObj = invertedObj;
    newObj[theMapObject[key]] = key;
    return newObj;
  }, {});

export default invertMapObject;

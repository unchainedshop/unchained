const invertMapObject = theMapObject =>
  Object.keys(theMapObject).reduce((invertedObj, key) => {
    const newObj = invertedObj;
    newObj[theMapObject[key]] = key;
    return newObj;
  }, {});

export default invertMapObject;

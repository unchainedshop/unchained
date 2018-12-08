/* eslint-disable */
willChangeWithParent = function(object, key) {
  if (!_.isObject(object)) {
    return;
  }
  var willChange = false;
  _.each(_.keys(object), function(modifyingKey) {
    if (key && key.indexOf(modifyingKey) === 0) {
      willChange = true;
    }
  });
  return willChange;
};

objectHasKey = function(object, key) {
  var dotNotation = {};

  (function recurse(obj, current) {
    for(var key in obj) {
      var value = obj[key];
      var newKey = (current ? current + "." + key : key);  // joined key with dot
      if(value && typeof value === "object") {
        recurse(value, newKey);  // it's a nested object, so do it again
      } else {
        dotNotation[newKey] = value;  // it's not an object, so set the property
      }
    }
  })(object);

  var keys = _.keys(dotNotation);
  var newKeys = [];

  _.each(keys, function(_key) {
    var parts = _key.split('.');
    var added = [];
    _.each(parts, function(part) {
      if (!isNaN(part)) {
        part = '$';
        added.push(part);
      } else {
        added.push(part);
        newKeys.push(added.join('.'));
      }
    });
  });

  return _.contains(newKeys, key);
};

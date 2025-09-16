exports.compile = function (msgs) {
  const results = {};
  Object.entries(msgs).forEach(([id, msg]) => {
    results[id] = msg.defaultMessage;
  });

  return results;
};

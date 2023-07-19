import util from 'util';

export default (workItems) => {
  return workItems
    .map(({ _id, type, input, started, error }) => {
      const stringifiedInput = util.inspect(input, false, 10, false);
      const stringifiedErrors = util.inspect(error, false, 10, false);
      return `${started} ${type} (${_id}): "${stringifiedInput}" (${stringifiedErrors})`;
    })
    .join('\n');
};

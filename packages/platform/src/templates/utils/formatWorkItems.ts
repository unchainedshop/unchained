import util from 'util';

export default (workItems) => {
  return workItems
    .map(({ _id, type, started, error }) => {
      const stringifiedErrors = util.inspect(error, false, 10, false);
      return `${new Date(started).toLocaleString()} ${type} (${_id}): ${stringifiedErrors}`;
    })
    .join('\n');
};

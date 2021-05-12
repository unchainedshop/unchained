import { Events } from './collections';

const buildFindSelector = ({ type }) => {
  return type ? { type } : {};
};

Events.findEvents = async ({
  limit,
  offset,
  sort = {
    created: -1,
  },
  ...query
}) => {
  return Events.find(buildFindSelector(query), {
    skip: offset,
    limit,
    sort,
  }).fetch();
};

Events.count = async (query) => {
  const count = await Events.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

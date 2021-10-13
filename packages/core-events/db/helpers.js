import { Events } from './collections';

const buildFindSelector = ({ type }) => {
  return type ? { type } : {};
};

Events.findEvent = async ({ eventId, ...rest }, options) => {
  const selector = eventId ? { _id: eventId } : rest;
  if (!Object.keys(selector)?.length) return null;
  return Events.findOne(selector, options);
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

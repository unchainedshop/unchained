import { FilterDirector } from 'meteor/unchained:core-filters';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING = 'DESC';
const DIRECTION_ASCENDING = 'ASC';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const normalizeDirection = (textualInput) => {
  if (textualInput === DIRECTION_ASCENDING) {
    return 1;
  }
  if (textualInput === DIRECTION_DESCENDING) {
    return -1;
  }
  return null;
};

const defaultStage = ({ orderBy }) => {
  if (orderBy === ORDER_BY_INDEX || !orderBy) {
    if (AMAZON_DOCUMENTDB_COMPAT_MODE) {
      return {
        sequence: 1,
      };
    }
    return {
      index: 1,
    };
  }
  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();
  const direction = normalizeDirection(maybeDirection);
  if (direction === null) orderBySlices.push(maybeDirection);
  const keyPath = orderBySlices.join('.');
  return {
    [keyPath]: direction === null ? 1 : direction,
    [AMAZON_DOCUMENTDB_COMPAT_MODE ? 'sequence' : 'index']: 1,
  };
};

export default async (query, options = {}) => {
  const stage = defaultStage(query);
  const director = new FilterDirector({ query, ...options });
  return director.buildSortStage(stage);
};

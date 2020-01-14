import { FilterDirector } from 'meteor/unchained:core-filters';

const ORDER_BY_INDEX = 'default';
const DIRECTION_DESCENDING = 'DESC';
const DIRECTION_ASCENDING = 'ASC';

const normalizeDirection = textualInput => {
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
    return {
      index: 1
    };
  }
  const orderBySlices = orderBy.split('_');
  const maybeDirection = orderBySlices.pop();
  const direction = normalizeDirection(maybeDirection);
  if (direction === null) orderBySlices.push(maybeDirection);
  const keyPath = orderBySlices.join('.');
  return {
    [keyPath]: direction === null ? 1 : direction
  };
};

export default async query => {
  const stage = defaultStage(query);
  const director = new FilterDirector({ query });
  return director.buildSortStage(stage);
};

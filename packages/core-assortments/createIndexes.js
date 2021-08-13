import createAssortmentIndexes from './db/assortments/schema';
import createAssortmentMediaIndexes from './db/assortment-media/schema';

export default () => {
  createAssortmentIndexes();
  createAssortmentMediaIndexes();
};

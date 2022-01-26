import { log } from 'meteor/unchained:logger';
import { AssortmentProducts, AssortmentLinks, AssortmentFilters, Assortments } from './db/assortments';

export default (repository, context) => {
  repository.register({
    id: 202110121200,
    async up() {
      // Do migrations
    },
  });
};

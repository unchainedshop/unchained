import { Promise } from 'meteor/promise';
import 'meteor/dburles:collection-helpers';
import { Filters } from './collections';
import { FilterDirector } from '../director';

Filters.helpers({
  format(key, value) {
    return value;
  },
  defaultContext() {
    return {};
  },
  interface() {
    return new FilterDirector(this).interfaceClass();
  },
  configurationError() {
    return new FilterDirector(this).configurationError();
  },
  isActive(context) {
    return new FilterDirector(this).isActive(context);
  },
  estimatedDispatch(context) {
    return Promise.await(new FilterDirector(this).estimatedDispatch(context));
  },
  estimatedStock(context) {
    return Promise.await(new FilterDirector(this).estimatedStock(context));
  },
});

Filters.createFilter = ({ type, ...rest }) => {
  const InterfaceClass = new FilterDirector(rest).interfaceClass();
  const providerId = Filters.insert({
    ...rest,
    created: new Date(),
    configuration: InterfaceClass.initialConfiguration,
    type,
  });
  return Filters.findOne({ _id: providerId });
};

Filters.updateFilter = ({ filterId, ...rest }) => {
  Filters.update({ _id: filterId }, {
    $set: {
      ...rest,
      updated: new Date(),
    },
  });
  return Filters.findOne({ _id: filterId });
};

Filters.removeFilter = ({ filterId }) => {
  const provider = Filters.findOne({ _id: filterId });
  Filters.remove({ _id: filterId });
  return provider;
};

Filters.findSupported = ({ product, deliveryFilter }) => {
  const providers = Filters
    .find()
    .fetch()
    .filter(filter => filter.isActive({ product, deliveryFilter }));
  return providers;
};

export const filterCollection = (pointer) => {
  console.log(this, pointer);
  return {
    totalCount: pointer.count(),
    items: pointer.fetch(),
    filters: [],
  }
}

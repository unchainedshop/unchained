import { InMemoryCache } from '@apollo/client';
import possibleTypes from '../possibleTypes.json';
import typePolicies from './typepolicies';

const apolloCache = (locale) => {
  const inMemoryCache = new InMemoryCache({
    typePolicies,
    possibleTypes,
  });
  return inMemoryCache;
};

export default apolloCache;

import scalars from './scalars';
import types from './types';
import inputTypes from './inputTypes';
import query from './query';
import mutation from './mutation';

export default [...scalars, ...types, ...inputTypes, ...query, ...mutation];

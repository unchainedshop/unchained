import scalars from './scalars';
import directives from './directives';
import types from './types';
import inputTypes from './inputTypes';
import query from './query';
import mutation from './mutation';

export default [...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation];

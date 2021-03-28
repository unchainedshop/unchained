import { BigInt } from 'graphql-scalars';
import address from './address';
import assortment from './assortment';
import color from './color';
import contact from './contact';
import country from './country';
import currency from './currency';
import delivery from './delivery';
import dimensions from './dimensions';
import discount from './discount';
import dispatch from './dispatch';
import filter from './filter';
import language from './language';
import log from './log';
import media from './media';
import price from './price';
import payment from './payment';
import shop from './shop';
import stock from './stock';
import types from './types';
import user from './user';
import warehousing from './warehousing';
import order from './order';
import product from './product';
import quotation from './quotation';
import geoposition from './geo-position';
import bookmark from './bookmark';
import search from './search';
import worker from './worker';
import enrollment from './enrollment';
import events from './events';
import files from './files';

export default [
  ...address,
  ...assortment,
  ...color,
  ...contact,
  ...country,
  ...currency,
  ...delivery,
  ...dimensions,
  ...discount,
  ...dispatch,
  ...filter,
  ...language,
  ...log,
  ...media,
  ...price,
  ...payment,
  ...shop,
  ...stock,
  ...types,
  ...user,
  ...warehousing,
  ...product,
  ...order,
  ...quotation,
  ...geoposition,
  ...bookmark,
  ...search,
  ...worker,
  ...enrollment,
  ...events,
  ...files,
];

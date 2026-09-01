import address from './address.ts';
import assortment from './assortment.ts';
import color from './color.ts';
import contact from './contact.ts';
import country from './country.ts';
import currency from './currency.ts';
import delivery from './delivery.ts';
import dimensions from './dimensions.ts';
import discount from './discount.ts';
import dispatch from './dispatch.ts';
import filter from './filter.ts';
import language from './language.ts';
import media from './media.ts';
import price from './price.ts';
import payment from './payment.ts';
import shop from './shop.ts';
import stock from './stock.ts';
import common from './common.ts';
import user from './user.ts';
import warehousing from './warehousing.ts';
import order from './order/index.ts';
import product from './product/index.ts';
import quotation from './quotation.ts';
import geoposition from './geo-position.ts';
import bookmark from './bookmark.ts';
import search from './search.ts';
import worker from './worker.ts';
import enrollment from './enrollment.ts';
import events from './events.ts';
import files from './files.ts';

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
  ...media,
  ...price,
  ...payment,
  ...shop,
  ...stock,
  ...common,
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

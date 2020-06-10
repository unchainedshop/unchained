import crypto from 'crypto';

export default {
  _id: ({
    product,
    deliveryProvider,
    warehousingProvider,
    referenceDate,
    country,
    userId,
  }) =>
    crypto
      .createHash('sha256')
      .update(
        [
          product._id,
          deliveryProvider._id,
          warehousingProvider._id,
          referenceDate,
          country,
          userId || 'ANONYMOUS',
        ].join(''),
      )
      .digest('hex'),
};

import crypto from 'crypto';

export default {
  _id: ({
    product,
    deliveryProvider,
    warehousingProvider,
    referenceDate,
    quantity,
    country,
    userId
  }) =>
    crypto
      .createHash('sha256')
      .update(
        [
          product._id,
          deliveryProvider._id,
          warehousingProvider._id,
          referenceDate,
          quantity,
          country,
          userId || 'ANONYMOUS'
        ].join('')
      )
      .digest('hex')
};

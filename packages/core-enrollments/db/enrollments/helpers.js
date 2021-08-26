import Hashids from 'hashids/cjs';
import 'meteor/dburles:collection-helpers';
import { Promise } from 'meteor/promise';
import { objectInvert } from 'meteor/unchained:utils';
import { Users } from 'meteor/unchained:core-users';
import { Products } from 'meteor/unchained:core-products';
import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Logs, log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { emit } from 'meteor/unchained:core-events';
import { Enrollments } from './collections';
import { EnrollmentStatus } from './schema';
import { EnrollmentDirector } from '../../director';

Logs.helpers({
  enrollment() {
    return (
      this.meta &&
      Enrollments.findOne({
        _id: this.meta.enrollmentId,
      })
    );
  },
});

Users.helpers({
  enrollments() {
    return Enrollments.find(
      { userId: this._id },
      {
        sort: {
          created: -1,
        },
      }
    ).fetch();
  },
});

Enrollments.findEnrollment = ({ enrollmentId }, options) => {
  return Enrollments.findOne({ _id: enrollmentId }, options);
};
Enrollments.findEnrollments = ({ limit, offset }) => {
  return Enrollments.find(
    {},
    {
      skip: offset,
      limit,
    }
  ).fetch();
};

Enrollments.count = async () => {
  const count = await Enrollments.rawCollection().countDocuments();
  return count;
};

Enrollments.helpers({
  user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  product() {
    return Products.findOne({
      _id: this.productId,
    });
  },
  country() {
    return Countries.findOne({ isoCode: this.countryCode });
  },
  currency() {
    return Currencies.findOne({ isoCode: this.currencyCode });
  },
  normalizedStatus() {
    return objectInvert(EnrollmentStatus)[this.status || null];
  },
  async terminate({ enrollmentContext } = {}, options) {
    if (this.status === EnrollmentStatus.TERMINATED) return this;
    const locale = this.user().locale(options);
    return (
      await this.setStatus(
        EnrollmentStatus.TERMINATED,
        'terminated manually'
      ).process({ enrollmentContext })
    ).sendStatusToCustomer({ locale });
  },
  async activate({ enrollmentContext } = {}, options) {
    if (this.status === EnrollmentStatus.TERMINATED) return this;
    const locale = this.user().locale(options);
    return (
      await this.setStatus(
        EnrollmentStatus.ACTIVE,
        'activated manually'
      ).process({ enrollmentContext })
    ).sendStatusToCustomer({ locale });
  },
  sendStatusToCustomer({ locale, reason = 'status_change' }) {
    WorkerDirector.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        reason,
        locale,
        template: 'ENROLLMENT_STATUS',
        enrollmentId: this._id,
      },
    });
    return this;
  },
  async initializeEnrollment({ orderIdForFirstPeriod, reason, locale } = {}) {
    const period = await this.director().nextPeriod({
      orderId: orderIdForFirstPeriod,
      reason,
      locale,
    });
    if (period && (orderIdForFirstPeriod || period.isTrial)) {
      const initialized = await Enrollments.addEnrollmentPeriod({
        orderId: orderIdForFirstPeriod,
        enrollmentId: this._id,
        period,
      });
      return initialized.process({ orderIdForFirstPeriod, reason, locale });
    }
    return this.process({ orderIdForFirstPeriod, reason, locale });
  },
  // eslint-disable-next-line
  async reactivateEnrollment() {},
  async process({ enrollmentContext, orderIdForFirstPeriod } = {}) {
    if (this.nextStatus() === EnrollmentStatus.ACTIVE) {
      await this.reactivateEnrollment(enrollmentContext, orderIdForFirstPeriod);
    }
    return this.setStatus(this.nextStatus(), 'enrollment processed');
  },
  nextStatus() {
    let { status } = this;
    const director = this.director();

    if (
      status === EnrollmentStatus.INITIAL ||
      status === EnrollmentStatus.PAUSED
    ) {
      if (Promise.await(director.isValidForActivation())) {
        status = EnrollmentStatus.ACTIVE;
      }
    } else if (status === EnrollmentStatus.ACTIVE) {
      if (Promise.await(director.isOverdue())) {
        status = EnrollmentStatus.PAUSED;
      }
    } else if (this.isExpired()) {
      status = EnrollmentStatus.TERMINATED;
    }
    return status;
  },
  director() {
    const director = new EnrollmentDirector(this);
    return director;
  },
  setStatus(status, info) {
    return Enrollments.updateStatus({
      enrollmentId: this._id,
      status,
      info,
    });
  },
  logs({ limit, offset }) {
    const selector = { 'meta.enrollmentId': this._id };
    const logs = Logs.find(selector, {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }).fetch();
    return logs;
  },
  isExpired({ referenceDate } = {}) {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    const expiryDate = new Date(this.expires);
    const isExpired = relevantDate.getTime() > expiryDate.getTime();
    return isExpired;
  },
});

Enrollments.createEnrollment = async (
  {
    productId,
    quantity,
    configuration,
    userId,
    countryCode,
    currencyCode,
    contact,
    billingAddress,
    payment,
    delivery,
    orderIdForFirstPeriod,
  },
  options
) => {
  log('Create Enrollment', { userId });
  const enrollmentId = Enrollments.insert({
    productId,
    quantity,
    configuration,
    created: new Date(),
    status: EnrollmentStatus.INITIAL,
    userId,
    contact,
    billingAddress,
    payment,
    periods: [],
    delivery,
    currencyCode:
      currencyCode ||
      Countries.resolveDefaultCurrencyCode({
        isoCode: countryCode,
      }),
    countryCode,
  });
  const enrollment = Enrollments.findOne({ _id: enrollmentId });
  const locale = enrollment.user().locale(options);
  const reason = 'new_enrollment';
  const initialized = await enrollment.initializeEnrollment({
    locale,
    reason,
    orderIdForFirstPeriod,
  });
  const enrollmentObject = initialized.sendStatusToCustomer({
    locale,
    reason,
    orderIdForFirstPeriod,
  });
  emit('ENROLLMENT_CREATE', { enrollment: enrollmentObject });
  return enrollmentObject;
};

Enrollments.addEnrollmentPeriod = async ({ enrollmentId, period, orderId }) => {
  const { start, end, isTrial } = period;
  Enrollments.update(
    { _id: enrollmentId },
    {
      $push: {
        periods: {
          start,
          end,
          isTrial,
          orderId,
        },
      },
      $set: {
        updated: new Date(),
      },
    }
  );
  return Enrollments.findOne({ _id: enrollmentId });
};

Enrollments.updateBillingAddress = ({ billingAddress, enrollmentId }) => {
  log('Update Billing Address', { enrollmentId });
  return Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        billingAddress,
        updated: new Date(),
      },
    }
  );
};

Enrollments.updateContact = ({ contact, enrollmentId }) => {
  log('Update Contact', { enrollmentId });
  Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        contact,
        updated: new Date(),
      },
    }
  );
  return Enrollments.findOne({ _id: enrollmentId });
};

Enrollments.updatePayment = ({ payment, enrollmentId }) => {
  log('Update Payment', { enrollmentId });
  return Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        payment,
        updated: new Date(),
      },
    }
  );
};

Enrollments.updateDelivery = ({ delivery, enrollmentId }) => {
  log('Update enrollment Delivery', { enrollmentId });
  return Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        delivery,
        updated: new Date(),
      },
    }
  );
};

Enrollments.updatePlan = async ({ plan, enrollmentId }, options) => {
  log('Update enrollment Plan', { enrollmentId });
  const result = Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        ...plan,
        periods: [],
        updated: new Date(),
      },
    }
  );
  const updatedEnrollment = Enrollments.findEnrollment({
    enrollmentId,
  });
  const reason = 'updated_plan';
  const locale = updatedEnrollment.user().locale(options);
  const initialized = await updatedEnrollment.initializeEnrollment({
    locale,
    reason,
  });
  initialized.sendStatusToCustomer({ locale, reason });
  return result;
};

Enrollments.updateContext = ({ context, enrollmentId }) => {
  log('Update enrollment Arbitrary Context', { enrollmentId });
  return Enrollments.update(
    { _id: enrollmentId },
    {
      $set: {
        context,
        updated: new Date(),
      },
    }
  );
};

Enrollments.newEnrollmentNumber = () => {
  let enrollmentNumber = null;
  const hashids = new Hashids(
    'unchained',
    6,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  );
  while (!enrollmentNumber) {
    const randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    const newHashID = hashids.encode(randomNumber);
    if (
      Enrollments.find(
        { enrollmentNumber: newHashID },
        { limit: 1 }
      ).count() === 0
    ) {
      enrollmentNumber = newHashID;
    }
  }
  return enrollmentNumber;
};

Enrollments.updateStatus = ({ status, enrollmentId, info = '' }) => {
  const enrollment = Enrollments.findOne({ _id: enrollmentId });
  if (enrollment.status === status) return enrollment;
  const date = new Date();
  const modifier = {
    $set: { status, updated: new Date() },
    $push: {
      log: {
        date,
        status,
        info,
      },
    },
  };
  switch (status) {
    case EnrollmentStatus.ACTIVE:
      modifier.$set.enrollmentNumber = Enrollments.newEnrollmentNumber();
      break;
    case EnrollmentStatus.TERMINATED:
      modifier.$set.expires = enrollment.periods?.pop()?.end || new Date();
      break;
    default:
      break;
  }
  log(`New Status: ${status}`, { enrollmentId });
  Enrollments.update({ _id: enrollmentId }, modifier);
  return Enrollments.findOne({ _id: enrollmentId });
};

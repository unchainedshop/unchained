import {
  EnrollmentDirector,
  EnrollmentAdapter,
} from 'meteor/unchained:core-enrollments';

const rangeMatcher = (date = new Date()) => {
  const timestamp = date.getTime();
  return ({ start, end }) => {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    return startTimestamp <= timestamp && endTimestamp >= timestamp;
  };
};

class LicensedEnrollments extends EnrollmentAdapter {
  static key = 'shop.unchained.enrollments.licensed';

  static version = '1.0';

  static label = 'Simple Licensed Enrollments';

  static orderIndex = 0;

  // eslint-disable-next-line
  static isActivatedFor({ usageCalculationType, ...plan }) {
    return usageCalculationType === 'LICENSED';
  }

  // eslint-disable-next-line
  async isValidForActivation() {
    const periods = this.context?.enrollment?.periods || [];
    const inRange = periods.find(rangeMatcher());
    return inRange;
  }

  // eslint-disable-next-line
  async isOverdue() {
    return false;
  }

  // eslint-disable-next-line
  async configurationForOrder(context) {
    const { period } = context;
    const beginningOfPeriod = period.start.getTime() <= new Date().getTime();
    if (beginningOfPeriod) {
      return context;
    }
    return null;
  }
}

EnrollmentDirector.registerAdapter(LicensedEnrollments);

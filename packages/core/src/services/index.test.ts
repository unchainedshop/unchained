import assert from 'node:assert/strict';
import { it } from 'node:test';
import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { EnrollmentDirector } from '../directors/EnrollmentDirector.ts';
import initServices from './index.ts';

it('processes enrollments through the enrollment adapter and module', async (t) => {
  const enrollment = {
    _id: 'enrollment-1',
    productId: 'plan-1',
    status: EnrollmentStatus.INITIAL,
  } as Enrollment;
  const product = { _id: enrollment.productId };
  const findProduct = t.mock.fn(async () => product);
  const updateEnrollment = t.mock.fn(async (_id, { status }) => ({ ...enrollment, status }));
  const updateOrder = t.mock.fn(async () => {
    throw new Error('Enrollment processing must not update an order');
  });
  const modules = {
    products: { findProduct },
    enrollments: { updateStatus: updateEnrollment },
    orders: { updateStatus: updateOrder },
  } as unknown as Modules;
  const adapterActions = t.mock.method(EnrollmentDirector, 'actions', async () => ({
    isValidForActivation: async () => true,
  }));

  const services = initServices(modules);
  const result = await services.enrollments.processEnrollment(enrollment);

  assert.equal(result.status, EnrollmentStatus.ACTIVE);
  assert.deepEqual(findProduct.mock.calls[0].arguments, [{ productId: 'plan-1' }]);
  assert.deepEqual(adapterActions.mock.calls[0].arguments, [{ enrollment, product }, { modules }]);
  assert.deepEqual(updateEnrollment.mock.calls[0].arguments, [
    'enrollment-1',
    { status: EnrollmentStatus.ACTIVE, info: 'enrollment processed' },
  ]);
  assert.equal(updateOrder.mock.callCount(), 0);
});

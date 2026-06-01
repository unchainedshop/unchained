import { UserEnrollmentsListResponse } from '../mock/user';
import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';

const EnrollmentOperations = {
  GetEnrollments: 'Enrollments',
  GetEnrollment: 'Enrollment',
};

const fixedEnrollments = UserEnrollmentsListResponse.data.user.enrollments.map(
  (e) => ({
    ...e,
    plan: {
      ...e.plan,
      configuration: Array.isArray(e.plan?.configuration)
        ? e.plan.configuration
        : Object.entries(e.plan?.configuration || {}).map(([key, value]) => ({
            key,
            value,
          })),
    },
  }),
);

const EnrollmentsListResponse = {
  data: {
    enrollments: fixedEnrollments,
    enrollmentsCount: fixedEnrollments.length,
  },
};

const SingleEnrollmentResponse = {
  data: {
    enrollment: fixedEnrollments[0],
  },
};

describe('Enrollment', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, EnrollmentOperations.GetEnrollments)) {
        aliasQuery(req, EnrollmentOperations.GetEnrollments);
        req.reply(EnrollmentsListResponse);
      }
      if (hasOperationName(req, EnrollmentOperations.GetEnrollment)) {
        aliasQuery(req, EnrollmentOperations.GetEnrollment);
        req.reply(SingleEnrollmentResponse);
      }
    });

    cy.visit('/enrollments');
    cy.wait(fullAliasName(EnrollmentOperations.GetEnrollments));
  });

  it('Should navigate to [ENROLLMENTS] page successfully', () => {
    cy.location('pathname').should('eq', '/enrollments/');
    cy.get('tr').should('have.length.gte', 2);
  });

  it('Should display enrollment list with correct data', () => {
    const [firstEnrollment] = EnrollmentsListResponse.data.enrollments;
    cy.contains(firstEnrollment.enrollmentNumber).should('be.visible');
  });

  it('Should navigate to [ENROLLMENT DETAIL] page successfully', () => {
    const { enrollment } = SingleEnrollmentResponse.data;

    cy.get(`a[href="/enrollments/?enrollmentId=${enrollment._id}"]`)
      .first()
      .click();

    cy.wait(fullAliasName(EnrollmentOperations.GetEnrollment)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables.enrollmentId).to.eq(
          enrollment._id,
        );
      },
    );

    cy.url().should(
      'include',
      `/enrollments/?enrollmentId=${enrollment._id}`,
    );
    cy.contains(enrollment.enrollmentNumber).should('be.visible');
  });
});

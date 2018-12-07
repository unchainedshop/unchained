import faker from 'faker';

export default () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  company: faker.random.boolean() && faker.company.companyName(),
  postalCode: faker.address.zipCode(),
  countryCode: faker.address.countryCode(),
  city: faker.address.city(),
  addressLine: faker.address.streetAddress(),
  addressLine2: faker.random.boolean() && faker.address.secondaryAddress(),
  regionCode: faker.random.boolean() && faker.address.state(),
});

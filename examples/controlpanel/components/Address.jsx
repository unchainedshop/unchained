import React from 'react';
import { List } from 'semantic-ui-react';

const address = ({
  firstName = '',
  lastName = '',
  company = null,
  addressLine = '',
  addressLine2 = null,
  postalCode = null,
  city = '',
  countryCode = '',
  regionCode = null,
}) => (
  <List>
    <List.Item>
      {firstName} {lastName}
    </List.Item>
    {company && <List.Item>{company}</List.Item>}
    <List.Item>{addressLine}</List.Item>
    {addressLine2 && <List.Item>{addressLine2}</List.Item>}
    {regionCode && <List.Item>{regionCode}</List.Item>}
    <List.Item>
      {postalCode} {city}
    </List.Item>
    <List.Item>{countryCode}</List.Item>
  </List>
);

export default address;

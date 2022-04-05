import React from 'react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { Container } from 'semantic-ui-react';

const SystemInfo = ({ data: { shopInfo } = {} } = {}) => (
  <Container fluid>
    <h2>System Information</h2>
    <p>Engine Version: {shopInfo?.version}</p>
    <p>
      Resolved Language: {shopInfo?.language?.isoCode} {shopInfo?.language?.name}
    </p>
    <p>
      Resolved Country: {shopInfo?.country?.isoCode} ({shopInfo?.country?.flagEmoji}{' '}
      {shopInfo?.country?.name})
    </p>
    <p>Resolved Currency: {shopInfo?.country?.defaultCurrency?.isoCode}</p>
  </Container>
);

export const SHOP_INFO_QUERY = gql`
  query shopInfo {
    shopInfo {
      _id
      version
      language {
        _id
        isoCode
        name
      }
      externalLinks {
        href
        title
      }
      country {
        _id
        isoCode
        flagEmoji
        name
        defaultCurrency {
          _id
          isoCode
        }
      }
    }
  }
`;

export default graphql(SHOP_INFO_QUERY)(SystemInfo);

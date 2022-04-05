import gql from 'graphql-tag';

export const SEARCH_USERS = gql`
  query users($queryString: String, $offset: Int, $limit: Int, $includeGuests: Boolean) {
    users(queryString: $queryString, limit: $limit, offset: $offset, includeGuests: $includeGuests) {
      _id
      isGuest
      name
    }
  }
`;

export const SEARCH_ORDERS = gql`
  query orders($offset: Int, $limit: Int, $includeCarts: Boolean, $queryString: String) {
    orders(offset: $offset, limit: $limit, includeCarts: $includeCarts, queryString: $queryString) {
      _id
      ordered
      orderNumber
      status
      user {
        _id
        name
      }
      total {
        amount
        currency
      }
    }
  }
`;

export const SEARCH_ASSORTMENTS = gql`
  query searchAssortments($queryString: String, $offset: Int, $limit: Int) {
    searchAssortments(queryString: $queryString, includeInactive: true) {
      assortments(limit: $limit, offset: $offset) {
        _id
        isActive
        texts {
          _id
          title
          description
        }
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query searchProducts($queryString: String, $offset: Int, $limit: Int) {
    searchProducts(queryString: $queryString, includeInactive: true) {
      products(limit: $limit, offset: $offset) {
        _id
        status
        texts {
          _id
          title
          description
        }
        media {
          texts {
            _id
            title
          }
          file {
            _id
            url
            name
          }
        }
      }
    }
  }
`;

export const SEARCH_WORK_TYPES = gql`
  query searchWorkTypes {
    activeWorkTypes
  }
`;

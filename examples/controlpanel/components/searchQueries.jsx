import gql from 'graphql-tag';

export const SEARCH_USERS = gql`
  query users(
    $queryString: String
    $offset: Int
    $limit: Int
    $includeGuests: Boolean
  ) {
    users(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeGuests: $includeGuests
    ) {
      _id
      isGuest
      name
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

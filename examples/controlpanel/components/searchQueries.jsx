import gql from 'graphql-tag';

export const SEARCH_USERS = gql`
  query users($queryString: String, $offset: Int, $includeGuests: Boolean) {
    users(
      queryString: $queryString
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
  query searchAssortments($queryString: String) {
    searchAssortments(queryString: $queryString, includeInactive: true) {
      assortments {
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
  query searchProducts($queryString: String, $limit: Int) {
    searchProducts(queryString: $queryString, includeInactive: true) {
      products {
        _id
        status
        texts {
          _id
          title
          description
        }
        media(limit: $limit) {
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

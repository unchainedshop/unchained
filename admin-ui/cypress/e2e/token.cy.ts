import { aliasQuery, fullAliasName } from '../utils/aliasQuery';
import hasOperationName from '../utils/hasOperationName';

const TokenOperations = {
  GetTokens: 'Tokens',
  GetToken: 'Token',
};

const TokensListResponse = {
  data: {
    tokens: [
      {
        _id: 'token-1',
        tokenSerialNumber: 'TKN-001-ABC',
        status: 'CENTRALIZED',
        quantity: 1,
        chainId: null,
        walletAddress: null,
        invalidatedDate: null,
        expiryDate: null,
        isInvalidateable: true,
        contractAddress: null,
        accessKey: 'access-key-1',
        ercMetadata: null,
        product: {
          _id: 'product-1',
          texts: { _id: 'text-1', slug: 'test-product', title: 'Test Product' },
          media: [],
          simulatedPrice: { amount: 1000, currencyCode: 'CHF' },
        },
        user: {
          _id: 'user-1',
          username: 'testuser',
          isGuest: false,
          primaryEmail: { address: 'test@example.com', verified: true },
          avatar: null,
          profile: {
            displayName: 'Test User',
            address: { firstName: 'Test', lastName: 'User' },
          },
        },
        __typename: 'Token',
      },
    ],
    tokensCount: 1,
  },
};

const SingleTokenResponse = {
  data: {
    token: {
      ...TokensListResponse.data.tokens[0],
      user: {
        ...TokensListResponse.data.tokens[0].user,
        name: 'Test User',
        lastContact: {
          telNumber: '+41000000000',
          emailAddress: 'test@example.com',
        },
      },
    },
  },
};

describe('Token', () => {
  beforeEach(() => {
    cy.intercept('POST', '/graphql', (req) => {
      if (hasOperationName(req, TokenOperations.GetTokens)) {
        aliasQuery(req, TokenOperations.GetTokens);
        req.reply(TokensListResponse);
      }
      if (hasOperationName(req, TokenOperations.GetToken)) {
        aliasQuery(req, TokenOperations.GetToken);
        req.reply(SingleTokenResponse);
      }
    });

    cy.visit('/tokens');
    cy.wait(fullAliasName(TokenOperations.GetTokens));
  });

  it('Should navigate to [TOKENS] page successfully', () => {
    cy.location('pathname').should('eq', '/tokens/');
  });

  it('Should display token list', () => {
    const [firstToken] = TokensListResponse.data.tokens;
    cy.contains(firstToken._id).should('be.visible');
    cy.contains('testuser').should('be.visible');
  });

  it('Should navigate to [TOKEN DETAIL] page successfully', () => {
    const { token } = SingleTokenResponse.data;

    cy.contains(token._id).click();

    cy.wait(fullAliasName(TokenOperations.GetToken)).then(
      (currentSubject) => {
        expect(currentSubject.request.body.variables.tokenId).to.eq(
          token._id,
        );
      },
    );

    cy.url().should('include', `tokenId=${token._id}`);
  });
});

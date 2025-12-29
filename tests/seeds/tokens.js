import { TokenizedProduct1 } from './products.js';

export const TestToken1 = {
  _id: 'test-token-1',
  userId: 'admin',
  productId: TokenizedProduct1._id,
  orderPositionId: 'order-position-1',
  tokenSerialNumber: 'TOKEN001',
  quantity: 1,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export const TestToken2 = {
  _id: 'test-token-2',
  userId: 'admin',
  productId: TokenizedProduct1._id,
  orderPositionId: 'order-position-2',
  tokenSerialNumber: 'TOKEN002',
  quantity: 2,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export const TestToken3 = {
  _id: 'test-token-3',
  userId: 'user',
  productId: TokenizedProduct1._id,
  orderPositionId: 'order-position-3',
  tokenSerialNumber: 'TOKEN003',
  quantity: 1,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0x9876543210fedcba',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export const InvalidatedToken = {
  _id: 'test-token-invalidated',
  userId: 'admin',
  productId: TokenizedProduct1._id,
  orderPositionId: 'order-position-4',
  tokenSerialNumber: 'TOKEN004',
  quantity: 1,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: new Date('2025-01-01T00:00:00Z'),
  expiryDate: null,
  meta: {},
};

// Token with walletAddress but no userId - already exported token
export const AlreadyExportedToken = {
  _id: 'test-token-already-exported',
  userId: null,
  productId: TokenizedProduct1._id,
  orderPositionId: 'order-position-5',
  tokenSerialNumber: 'TOKEN005',
  quantity: 1,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0xexportedwallet1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

// Token with invalid productId - for testing product not found error
// NOTE: This token is NOT seeded to the database to avoid breaking token queries
// It is inserted directly in the test that needs it
export const TokenWithInvalidProduct = {
  _id: 'test-token-invalid-product',
  userId: 'admin',
  productId: 'non-existent-product-id',
  orderPositionId: 'order-position-6',
  tokenSerialNumber: 'TOKEN006',
  quantity: 1,
  contractAddress: '0x1234567890abcdef',
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export default async function seedTokens(db) {
  await db.collection('token_surrogates').findOrInsertOne(TestToken1);
  await db.collection('token_surrogates').findOrInsertOne(TestToken2);
  await db.collection('token_surrogates').findOrInsertOne(TestToken3);
  await db.collection('token_surrogates').findOrInsertOne(InvalidatedToken);
  await db.collection('token_surrogates').findOrInsertOne(AlreadyExportedToken);
  // TokenWithInvalidProduct is NOT seeded here - it's inserted directly in the test
}

import { SimplePosition } from './orders.js';
import { TokenizedProduct } from './products.js';
import { User } from './users.js';

export const TestToken1 = {
  _id: 'test-token-1',
  userId: User._id,
  productId: TokenizedProduct._id,
  orderPositionId: SimplePosition,
  tokenSerialNumber: 'TOKEN001',
  quantity: 1,
  contractAddress: TokenizedProduct.tokenization.contractAddress,
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export const TestToken2 = {
  _id: 'test-token-2',
  userId: User._id,
  productId: TokenizedProduct._id,
  orderPositionId: SimplePosition._id,
  tokenSerialNumber: 'TOKEN002',
  quantity: 2,
  contractAddress: TokenizedProduct.tokenization.contractAddress,
  chainId: '1',
  walletAddress: '0xabcdef1234567890',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export const TestToken3 = {
  _id: 'test-token-3',
  userId: User._id,
  productId: TokenizedProduct._id,
  orderPositionId: SimplePosition,
  tokenSerialNumber: 'TOKEN003',
  quantity: 1,
  contractAddress: TokenizedProduct.tokenization.contractAddress,
  chainId: '1',
  walletAddress: '0x9876543210fedcba',
  invalidatedDate: null,
  expiryDate: null,
  meta: {},
};

export default async function seedTokens(db) {
  await db.collection('token_surrogates').findOrInsertOne(TestToken1);
  await db.collection('token_surrogates').findOrInsertOne(TestToken2);
  await db.collection('token_surrogates').findOrInsertOne(TestToken3);
}

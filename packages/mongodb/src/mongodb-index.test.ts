import { SortDirection } from '@unchainedshop/utils';
import {
  buildSortOptions,
  checkId,
  generateDbObjectId,
} from './mongodb-index.js';

describe('Mongo', () => {
  it('Init', async () => {
    expect(true).toBeTruthy()
  });

  describe('buildSortOptions', () => {
    it('should return the correct db sort format', () => {
      const sort = [    { key: 'name', value: SortDirection.ASC },    { key: 'age', value: SortDirection.DESC },  ];
      expect(buildSortOptions(sort)).toEqual({ name: 1, age: -1 });
    })
    
  });
  
  describe('checkId', () => {
    it('with a string value', () => {
      const value = '12345';
      const error = { message: 'Invalid id' };
    
      expect(() => checkId(value, error)).not.toThrow();
    });
    
    it('with a non-string value', () => {
      const value: any = 12345;
      const error = { message: 'Invalid id' };
    
      expect(() => checkId(value, error)).toThrow('Invalid id');
    });
    
    it('with a different error object', () => {
      const value:any = 12345;
      const error = { message: 'Invalid id', path: 'name' };
    
      expect(() => checkId(value, error)).toThrow('Invalid id');
    });
    
    it('without an error object', () => {
      const value: any = 12345;
    
      expect(() => checkId(value)).toThrow();
    });
    
  });
  describe('generateDbObjectId', () => {
  it('generateDbObjectId with default digits', () => {
    const result = generateDbObjectId();
    expect(typeof result).toBe('string');
    expect(result.length).toBe(24);
  });
  
  it('generateDbObjectId with odd digits', () => {
    const result = generateDbObjectId(23);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(23);
  });
  
  it('generateDbObjectId with even digits', () => {
    const result = generateDbObjectId(24);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(24);
  });
  
  })
});


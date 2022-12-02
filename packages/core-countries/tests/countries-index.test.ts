
import {buildFindSelector} from '../src/module/configureCountriesModule'
describe('Country', () => {
  
  it('buildFindSelector should return correct filter object', async () => {

    expect(buildFindSelector({includeInactive: true, queryString: 'hello world'})).toEqual({ deleted: undefined, '$text': { '$search': 'hello world' } })
    expect(buildFindSelector({includeInactive: true})).toEqual({ deleted: undefined })
    expect(buildFindSelector({queryString: 'hello world'})).toEqual({ deleted: undefined, '$text': { '$search': 'hello world' }, isActive: true })
  });

});

import { EnrollmentStatus } from "@unchainedshop/core-enrollments";
import { buildFindSelector } from "./configureEnrollmentsModule.js";

describe('buildFindSelector', () => {
  it('Should correct filter when passed status, userId and queryString', () => {
    expect(buildFindSelector({queryString: "Hello World", status: [EnrollmentStatus.ACTIVE], userId: 'admin-id'})).toEqual({
      deleted: null,
      status: { '$in': [ 'ACTIVE' ] },
      userId: 'admin-id',
      '$text': { '$search': 'Hello World' }
    })    
  });
  it('Should correct filter when passed userId and queryString', () => {
    
    expect(buildFindSelector({queryString: "Hello World",  userId: 'admin-id'})).toEqual({
      deleted: null,
      userId: 'admin-id',
      '$text': { '$search': 'Hello World' }
    })    
  });

  it('Should correct filter when passed  queryString', () => {
    
    expect(buildFindSelector({queryString: "Hello World"})).toEqual({
      deleted: null,        
      '$text': { '$search': 'Hello World' }
    })    
  });

  it('Should correct filter when passed  no argument', () => {
    
    expect(buildFindSelector({})).toEqual({
      deleted: null,        
    })    
  });
})

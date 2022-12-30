import { EnrollmentStatus } from "@unchainedshop/types/enrollments";
import {periodForReferenceDate} from "../src/director/EnrollmentAdapter.js";

import {buildFindSelector} from "../src/module/configureEnrollmentsModule.js"


describe('Enrollment', () => {
  describe('periodForReferenceDate', () => {
    it('Should return 1 week interval from When passed a given date', async () => {
      expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'))).toEqual({ start: new Date( '2022-12-03T17:00:00.000Z'), end: new Date('2022-12-10T17:00:00.000Z') })    
    });
    it('Should return 2 week interval from When passed 2 as interval', async () => {
      expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2)).toEqual({ start: new Date( '2022-12-03T17:00:00.000Z'), end: new Date('2022-12-17T17:00:00.000Z') })    
    });

    it('Should return 2 HOURS when interval is set to HOURS', async () => {
      expect(periodForReferenceDate(new Date('2022-12-03T17:00:00.000Z'), 2, 'HOURS')).toEqual({ start: new Date( '2022-12-03T17:00:00.000Z'), end: new Date('2022-12-03T19:00:00.000Z') })    
    }); 
  });

  describe('buildFindSelector', () => {
    it('Should correct filter when passed status, userId and queryString', async () => {
      expect(buildFindSelector({queryString: "Hello World", status: [EnrollmentStatus.ACTIVE], userId: 'admin-id'})).toEqual({
        deleted: null,
        status: { '$in': [ 'ACTIVE' ] },
        userId: 'admin-id',
        '$text': { '$search': 'Hello World' }
      })    
    });
    it('Should correct filter when passed userId and queryString', async () => {
      
      expect(buildFindSelector({queryString: "Hello World",  userId: 'admin-id'})).toEqual({
        deleted: null,
        userId: 'admin-id',
        '$text': { '$search': 'Hello World' }
      })    
    });

    it('Should correct filter when passed  queryString', async () => {
      
      expect(buildFindSelector({queryString: "Hello World"})).toEqual({
        deleted: null,        
        '$text': { '$search': 'Hello World' }
      })    
    });

    it('Should correct filter when passed  no argument', async () => {
      
      expect(buildFindSelector({})).toEqual({
        deleted: null,        
      })    
    });
  })
})

import { generateIssueComment } from '../src/utils';
import { getOccurrence } from './utils';
import { newClaims, claimsWith3GitPoaps, claimsWith1GitPoap } from './fixtures/claims';

describe('Comments', () => {
  describe('generateIssueComment', () => {
    it('should contain correct data for newClaims', () => {
      const comment = generateIssueComment(newClaims);
      // it should contain `congrats` for 3 times
      expect(getOccurrence(comment, 'Congrats,')).toEqual(3);
      // it should contain image for 3 times
      expect(getOccurrence(comment, '<img alt=')).toEqual(3);
      // it should contain `@test1` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test1')).toEqual(1);
      // it should contain `@test2` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test2')).toEqual(1);
      // it should contain `@test3` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test3')).toEqual(1);
    });

    it('should contain correct data for claimsWith3GitPoaps', () => {
      const comment = generateIssueComment(claimsWith3GitPoaps);
      // it should contain `congrats` for 3 times
      expect(getOccurrence(comment, 'Congrats,')).toEqual(3);
      // it should contain image for 3 times
      expect(getOccurrence(comment, '<img alt=')).toEqual(3);
      // it should contain `@test1` for 2 times since he has 2 claims
      expect(getOccurrence(comment, '@test1')).toEqual(2);
      // it should contain `@test2` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test2')).toEqual(1);
      // it should contain `@test3` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test3')).toEqual(1);
    });

    it('should contain correct data for claimsWith1GitPoap', () => {
      const comment = generateIssueComment(claimsWith1GitPoap);
      // it should contain `congrats` for 1 time
      expect(getOccurrence(comment, 'Congrats,')).toEqual(1);
      // it should contain image for 1 time
      expect(getOccurrence(comment, '<img alt=')).toEqual(1);
      // it should contain `@test1` for 1 time since he has 1 claim
      expect(getOccurrence(comment, '@test1')).toEqual(1);
      // it should contain `@test2` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test2')).toEqual(1);
      // it should contain `@test3` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test3')).toEqual(1);
      // it should contain `@test4` for 1 time since he has only 1 claim
      expect(getOccurrence(comment, '@test4')).toEqual(1);
    });
  });
});

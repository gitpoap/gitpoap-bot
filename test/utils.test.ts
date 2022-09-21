import { generateIssueComment, parseComment, hasGitPoapBotTagged } from '../src/utils';
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

describe('Parse Comment', () => {
  it('should parse hype and special characters in username', () => {
    const contributors = parseComment('@gitpoap-bot @test-test');
    expect(contributors).toEqual(['test-test']);
  });

  it('should parse special characters in username', () => {
    const contributors = parseComment('@gitpoap-bot; @test##test @test2_@test1');
    expect(contributors).toEqual(['test', 'test2']);
  });

  it('should parse all usernames in the comments', () => {
    const contributors = parseComment('@test @test-test @gitpoap-bot; @test1');
    expect(contributors).toEqual(['test', 'test-test', 'test1']);
  });
});

describe('Check gitpoap-bot in the comment', () => {
  it('should recognize @gitpoap bot tagged at the beginning', () => {
    expect(hasGitPoapBotTagged('@gitpoap-bot @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('@gitpoap-bot    @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('"@gitpoap-bot"    @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged("'@gitpoap-bot'@test-test")).toEqual(true);
    expect(hasGitPoapBotTagged("'@gitpoap-bot'    @test-test")).toEqual(true);
    expect(hasGitPoapBotTagged('"@gitpoap-bot"t @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('@gitpoap-bot @test-test@gitpoap-bot')).toEqual(true);

    expect(hasGitPoapBotTagged('@gitpoap-bot@test-test')).toEqual(false);
    expect(hasGitPoapBotTagged('@gitpoap-bot@test-test')).toEqual(false);
    expect(hasGitPoapBotTagged('@gitpoap-bott @test-test')).toEqual(false);
  });

  it('should recognize @gitpoap bot tagged in the middle', () => {
    expect(hasGitPoapBotTagged('congrats @gitpoap-bot @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('For good contributes, @gitpoap-bot    @test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('Hey   "@gitpoap-bot"@test-test')).toEqual(true);
    expect(hasGitPoapBotTagged('Hey   @"@gitpoap-bot"@test-test')).toEqual(true);

    expect(hasGitPoapBotTagged('Hey   @gitpoap-bot@test-test')).toEqual(false);
    expect(hasGitPoapBotTagged('Hey   @gitpoap-bbot @test-test')).toEqual(false);
    expect(hasGitPoapBotTagged('Hey   "@gitpoap-bot@test-test')).toEqual(false);
    expect(hasGitPoapBotTagged("Hey   @gitpoap-bot'@test-test")).toEqual(false);
  });

  it('should recognize @gitpoap bot tagged at the end', () => {
    expect(hasGitPoapBotTagged('congrats @test-test @gitpoap-bot')).toEqual(true);
    expect(hasGitPoapBotTagged('For good contributes, @test-test"@gitpoap-bot"')).toEqual(true);
    expect(hasGitPoapBotTagged("Hey   @test-test@'@gitpoap-bot'")).toEqual(true);
    expect(hasGitPoapBotTagged('Hey   @test-test@gitpoap-bot @gitpoap-bot')).toEqual(true);

    expect(hasGitPoapBotTagged('Hey   @test-test@gitpoap-bot')).toEqual(false);
    expect(hasGitPoapBotTagged('Hey   @test "@gitpoap-bot')).toEqual(false);
    expect(hasGitPoapBotTagged('Hey   @test@gitpoap-bot"')).toEqual(false);
    expect(hasGitPoapBotTagged("Hey   @testt@gitpoap-bot'")).toEqual(false);
  });
});

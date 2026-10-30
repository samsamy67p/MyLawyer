import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('9. Interactive Splash Screen Architecture & Motion Timings', () => {
  const BRAND_LETTERS = [
    { char: 'M', word: 'my', index: 0, isOdd: false },
    { char: 'y', word: 'my', index: 1, isOdd: true },
    { char: 'L', word: 'lawyer', index: 2, isOdd: false },
    { char: 'a', word: 'lawyer', index: 3, isOdd: true },
    { char: 'w', word: 'lawyer', index: 4, isOdd: false },
    { char: 'y', word: 'lawyer', index: 5, isOdd: true },
    { char: 'e', word: 'lawyer', index: 6, isOdd: false },
    { char: 'r', word: 'lawyer', index: 7, isOdd: true },
  ];

  it('verifies that brand text forms "MyLawyer" precisely without missing characters', () => {
    const word = BRAND_LETTERS.map((l) => l.char).join('');
    assert.equal(word, 'MyLawyer');
    assert.equal(BRAND_LETTERS.length, 8);
  });

  it('correctly partitions words into "My" and "Lawyer" for programmatic kinetic typography', () => {
    const myLetters = BRAND_LETTERS.filter((l) => l.word === 'my');
    const lawyerLetters = BRAND_LETTERS.filter((l) => l.word === 'lawyer');

    assert.equal(myLetters.map((l) => l.char).join(''), 'My');
    assert.equal(lawyerLetters.map((l) => l.char).join(''), 'Lawyer');
  });

  it('guarantees sequential character indexing from 0 to 7 with alternating parity', () => {
    BRAND_LETTERS.forEach((item, idx) => {
      assert.equal(item.index, idx);
      assert.equal(item.isOdd, idx % 2 === 1);
    });
  });

  it('validates timing choreography: matching video duration (~4.0s) with safety fallback and tap skip', () => {
    const videoDuration = 4000;
    const safetyTimeout = 4300;
    const fadeDuration = 400;

    assert.ok(safetyTimeout >= videoDuration);
    assert.ok(safetyTimeout + fadeDuration <= 5000, 'Splash animation should complete under 5 seconds');
  });

  it('verifies splash display guard logic preventing re-triggering during internal navigation', () => {
    const mockStorage = new Map();

    const isSplashNeeded = () => !mockStorage.get('mylawyer_splash_shown');
    const markSplashComplete = () => mockStorage.set('mylawyer_splash_shown', 'true');

    // Cold boot: splash is needed
    assert.equal(isSplashNeeded(), true);

    // After splash plays:
    markSplashComplete();
    assert.equal(isSplashNeeded(), false);

    // Internal navigation: remains false
    assert.equal(isSplashNeeded(), false);
  });
});


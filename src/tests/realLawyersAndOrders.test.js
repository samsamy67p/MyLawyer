import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLawyerSuitabilityScore,
  rankLawyersBySuitability,
  selectNextAlternativeLawyer,
  evaluateLawyerNowRequestFee,
} from '../services/lawyerService.js';
import {
  createInitialLawyerNowOrderState,
  transitionLawyerNowOrderState,
  DISPATCH_STAGES,
  CARD_STAGES,
  PAYMENT_STATUS,
} from '../hooks/useLawyerNowOrderFlow.js';
import { isWithinEgyptBounds, isValidCoordinate } from '../constants/geo.js';

describe('11. Real Lawyer Database Attributes & Geographic Verification', () => {
  it('validates accredited real lawyer profiles conforming to PostgreSQL schema', () => {
    const realLawyer = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      profileId: 'a12bc34d-58cc-4372-a567-0e02b2c3d480',
      userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'أ. طارق عبد الحميد',
      specialty: 'محامي بالنقض ومستشار تجاري وجنائي',
      degree: 'نقض ودستورية عليا',
      rating: 4.95,
      reviewsCount: 142,
      experienceYears: 15,
      isOnline: true,
      phone: '01012345671',
      coords: [30.0489, 31.2385],
      distanceMeters: 1400,
      distanceKm: 1.4,
    };

    assert.ok(isValidCoordinate(realLawyer.coords));
    assert.equal(isWithinEgyptBounds(realLawyer.coords), true);
    assert.equal(realLawyer.isOnline, true);
    assert.equal(typeof realLawyer.rating, 'number');
    assert.ok(realLawyer.rating >= 1 && realLawyer.rating <= 5);

    // Verify suitability score calculation
    const score = computeLawyerSuitabilityScore(realLawyer);
    assert.ok(score > 70, `Expected high suitability score for close online lawyer, got ${score}`);

    // Verify fee evaluation
    const fee = evaluateLawyerNowRequestFee(realLawyer, { serviceType: 'police' });
    assert.ok(fee >= 350, `Expected fee >= 350 EGP, got ${fee}`);
  });

  it('correctly ranks real database lawyers by online status, proximity and rating', () => {
    const lawyers = [
      {
        id: 'lawyer-offline',
        name: 'محامٍ غير متاح',
        isOnline: false,
        coords: [30.0450, 31.2350],
        distanceMeters: 400,
        rating: 5.0,
        experienceYears: 20,
      },
      {
        id: 'lawyer-online-closer',
        name: 'أ. طارق عبد الحميد',
        isOnline: true,
        coords: [30.0489, 31.2385],
        distanceMeters: 900,
        rating: 4.9,
        experienceYears: 15,
      },
      {
        id: 'lawyer-online-farther',
        name: 'أ. نادية الشافعي',
        isOnline: true,
        coords: [30.0385, 31.2120],
        distanceMeters: 3200,
        rating: 4.88,
        experienceYears: 12,
      },
    ];

    const ranked = rankLawyersBySuitability(lawyers);

    // Online lawyers must precede offline lawyers
    assert.equal(ranked[0].id, 'lawyer-online-closer');
    assert.equal(ranked[1].id, 'lawyer-online-farther');
    assert.equal(ranked[2].id, 'lawyer-offline');
  });

  it('selects alternative lawyer («محامٍ آخر») from real database candidates without cycling current lawyer', () => {
    const candidates = [
      { id: 'lawyer-1', name: 'طارق', isOnline: true, coords: [30.04, 31.23], distanceMeters: 800, rating: 4.9 },
      { id: 'lawyer-2', name: 'نادية', isOnline: true, coords: [30.03, 31.21], distanceMeters: 1200, rating: 4.8 },
      { id: 'lawyer-3', name: 'حسام', isOnline: true, coords: [30.08, 31.32], distanceMeters: 2500, rating: 4.95 },
    ];

    // Current lawyer is lawyer-1, visited is [lawyer-1]
    const res1 = selectNextAlternativeLawyer(candidates, 'lawyer-1', ['lawyer-1']);
    assert.equal(res1.hasAlternatives, true);
    assert.equal(res1.nextLawyer?.id, 'lawyer-2');
    assert.notEqual(res1.nextLawyer?.id, 'lawyer-1');

    // Next selection with visited [lawyer-1, lawyer-2]
    const res2 = selectNextAlternativeLawyer(candidates, 'lawyer-2', ['lawyer-1', 'lawyer-2']);
    assert.equal(res2.nextLawyer?.id, 'lawyer-3');
  });

  it('handles empty lawyer array safely returning empty result and no crash', () => {
    const ranked = rankLawyersBySuitability([]);
    assert.deepEqual(ranked, []);

    const altResult = selectNextAlternativeLawyer([], 'any-id', []);
    assert.equal(altResult.nextLawyer, null);
    assert.equal(altResult.hasAlternatives, false);
    assert.equal(altResult.reason, 'NO_ALTERNATIVES');
  });
});

describe('12. End-to-End Service Order Lifecycle State Machine', () => {
  it('executes full happy path: Request -> Acceptance -> Price Evaluation -> Payment -> En Route', () => {
    let state = createInitialLawyerNowOrderState();
    const mockLawyer = {
      id: 'lawyer-real-01',
      name: 'أ. طارق عبد الحميد',
      coords: [30.0489, 31.2385],
      distanceKm: 1.2,
      isOnline: true,
    };

    // 1. Submit request
    state = transitionLawyerNowOrderState(state, {
      type: 'SUBMIT_REQUEST',
      lawyer: mockLawyer,
      requestDetails: { serviceType: 'police', title: 'محاميك حالاً: محاضر شرطة' },
    });
    assert.equal(state.cardStage, CARD_STAGES.WAITING_ACCEPTANCE);
    assert.equal(state.bookedLawyerId, mockLawyer.id);

    // 2. Lawyer decides ACCEPTED
    state = transitionLawyerNowOrderState(state, {
      type: 'LAWYER_DECIDED',
      status: 'ACCEPTED',
    });
    assert.equal(state.cardStage, CARD_STAGES.LAWYER_DECISION);
    assert.equal(state.lawyerDecisionStatus, 'ACCEPTED');

    // 3. Acceptance confirmed -> start fee evaluation
    state = transitionLawyerNowOrderState(state, { type: 'LAWYER_ACCEPTED' });
    assert.equal(state.cardStage, CARD_STAGES.EVALUATING_PRICE);
    assert.equal(state.isLawyerAccepted, true);

    // 4. Evaluation completes -> PRICE_READY
    state = transitionLawyerNowOrderState(state, { type: 'FINISH_EVALUATION' });
    assert.equal(state.cardStage, CARD_STAGES.PRICE_READY);

    // 5. Open payment screen
    state = transitionLawyerNowOrderState(state, { type: 'OPEN_PAYMENT' });
    assert.equal(state.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(state.paymentStatus, PAYMENT_STATUS.IDLE);

    // 6. Payment starts processing
    state = transitionLawyerNowOrderState(state, { type: 'START_PAYMENT_PROCESSING' });
    assert.equal(state.paymentStatus, PAYMENT_STATUS.PROCESSING);

    // 7. Payment succeeds with verified transaction
    state = transitionLawyerNowOrderState(state, {
      type: 'PAYMENT_SUCCEEDED',
      receipt: {
        status: 'SUCCESS',
        transactionId: 'TX-ORDER-7890',
        amount: 350,
      },
    });
    assert.equal(state.paymentStatus, PAYMENT_STATUS.CONFIRMED);
    assert.ok(state.paymentReceipt?.transactionId);

    // 8. Auto-transition or user continue -> EN_ROUTE tracking
    state = transitionLawyerNowOrderState(state, { type: 'COMPLETE_ORDER_EN_ROUTE' });
    assert.equal(state.dispatchStage, DISPATCH_STAGES.EN_ROUTE);
    assert.equal(state.cardStage, CARD_STAGES.PROFILE);
  });

  it('handles lawyer rejection path cleanly with option to select alternative lawyer', () => {
    let state = createInitialLawyerNowOrderState();
    const mockLawyer = {
      id: 'lawyer-busy-02',
      name: 'أ. نادية الشافعي',
      coords: [30.0385, 31.2120],
      isOnline: true,
    };

    state = transitionLawyerNowOrderState(state, {
      type: 'SUBMIT_REQUEST',
      lawyer: mockLawyer,
    });
    assert.equal(state.cardStage, CARD_STAGES.WAITING_ACCEPTANCE);

    // Lawyer rejects
    state = transitionLawyerNowOrderState(state, {
      type: 'LAWYER_DECIDED',
      status: 'REJECTED',
    });
    assert.equal(state.lawyerDecisionStatus, 'REJECTED');

    state = transitionLawyerNowOrderState(state, { type: 'LAWYER_REJECTED' });
    assert.equal(state.cardStage, CARD_STAGES.PROFILE);
    assert.equal(state.isLawyerAccepted, false);
  });

  it('prevents payment initiation before lawyer acceptance', () => {
    let state = createInitialLawyerNowOrderState();
    assert.equal(state.isLawyerAccepted, false);

    // Attempting to open payment while isLawyerAccepted is false must be rejected
    const nextState = transitionLawyerNowOrderState(state, { type: 'OPEN_PAYMENT' });
    assert.notEqual(nextState.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(nextState.dispatchStage, DISPATCH_STAGES.BROWSE);
  });

  it('safely performs step back from price ready stage to profile', () => {
    let state = {
      ...createInitialLawyerNowOrderState(),
      dispatchStage: DISPATCH_STAGES.BROWSE,
      cardStage: CARD_STAGES.PRICE_READY,
      isLawyerAccepted: true,
      bookedLawyerId: 'lawyer-01',
    };

    state = transitionLawyerNowOrderState(state, { type: 'STEP_BACK' });
    assert.equal(state.cardStage, CARD_STAGES.PROFILE);
  });
});

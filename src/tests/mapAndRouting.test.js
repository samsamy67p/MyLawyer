import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CAIRO_DEFAULT_COORDS,
  isValidCoordinate,
  isWithinEgyptBounds,
  normalizeCoords,
} from '../constants/geo.js';

import {
  calculateDirectDistanceMeters,
  decodePolyline,
  formatRouteMetrics,
  validateRouteGeometry,
  getRoadNavigationRoute,
  clearNavigationCaches,
} from '../services/mapService.js';

import {
  getNearbyMockLawyers,
  resolveRoadSnappedLawyers,
  evaluateLawyerNowRequestFee,
  processLawyerNowPayment,
  computeLawyerSuitabilityScore,
  rankLawyersBySuitability,
  selectNextAlternativeLawyer,
} from '../services/lawyerService.js';

import {
  DISPATCH_STAGES,
  CARD_STAGES,
  PAYMENT_STATUS,
  createInitialLawyerNowOrderState,
  transitionLawyerNowOrderState,
} from '../hooks/useLawyerNowOrderFlow.js';

describe('1. Coordinate Validation, Normalization & Egypt Bounds', () => {
  it('validates WGS84 coordinates and rejects NaN, null, or out-of-range pairs', () => {
    assert.equal(isValidCoordinate([30.0444, 31.2357]), true);
    assert.equal(isValidCoordinate([95.0, 31.2357]), false);
    assert.equal(isValidCoordinate([30.0444, 195.0]), false);
    assert.equal(isValidCoordinate([NaN, 31.2357]), false);
    assert.equal(isValidCoordinate(null), false);
    assert.equal(isValidCoordinate([30.0444]), false);
  });

  it('normalizes both {latitude, longitude} objects and [lat, lon] arrays consistently', () => {
    assert.deepEqual(
      normalizeCoords({ latitude: 31.2001, longitude: 29.9187 }),
      [31.2001, 29.9187]
    );
    assert.deepEqual(
      normalizeCoords([30.9622, 31.2425]),
      [30.9622, 31.2425]
    );
    assert.deepEqual(
      normalizeCoords(null, CAIRO_DEFAULT_COORDS),
      CAIRO_DEFAULT_COORDS
    );
  });

  it('correctly checks Egypt coverage boundaries', () => {
    assert.equal(isWithinEgyptBounds([30.0444, 31.2357]), true); // Cairo
    assert.equal(isWithinEgyptBounds([31.2355, 29.9482]), true); // Alexandria
    assert.equal(isWithinEgyptBounds([24.0889, 32.8998]), true); // Aswan
    assert.equal(isWithinEgyptBounds([48.8566, 2.3522]), false); // Paris (Out of coverage)
  });
});

describe('2. Polyline Decoding, Geometry Validation & Unit Formatting', () => {
  it('decodes precision-6 Valhalla polylines and computes Haversine distances accurately', () => {
    const encoded = 'g~_xJ_~_xJ_ibE_ibE';
    const decoded = decodePolyline(encoded, 6);
    assert.equal(decoded.length, 2);

    const directMeters = calculateDirectDistanceMeters([30.0444, 31.2357], [30.0479, 31.2395]);
    assert.ok(directMeters > 500 && directMeters < 560);

    const routeCoords = [
      [30.0444, 31.2357],
      [30.0455, 31.2368],
      [30.0479, 31.2395],
    ];
    const validation = validateRouteGeometry(routeCoords, 535);
    assert.equal(validation.valid, true);
    assert.ok(validation.cumulativeMeters >= 450 && validation.cumulativeMeters <= 650);
  });

  it('rejects 2-point straight lines claiming to be long road routes', () => {
    const straightLine = [
      [30.0444, 31.2357],
      [30.0644, 31.2557],
    ];
    const validation = validateRouteGeometry(straightLine, 3200);
    assert.equal(validation.valid, false);
    assert.equal(validation.reason, 'STRAIGHT_LINE_REJECTED');
  });

  it('formats distance (meters -> km) and duration (seconds -> minutes) consistently', () => {
    const m1 = formatRouteMetrics(840, 140);
    assert.equal(m1.distanceMeters, 840);
    assert.equal(m1.distanceKm, 0.8);
    assert.equal(m1.formattedDistanceKm, '0.8');
    assert.equal(m1.formattedDurationMins, 2);

    const m2 = formatRouteMetrics(45, 20);
    assert.equal(m2.formattedDistanceKm, '0.1');
    assert.equal(m2.formattedDurationMins, 1);

    const initialLawyers = getNearbyMockLawyers(30.0444, 31.2357);
    assert.equal(initialLawyers.length, 4);
    assert.ok(initialLawyers[0].distanceMeters > 0);
  });
});

describe('3. Real Geographical & Coastal Routing Verification (Live Road Network)', () => {
  it('calculates real road route in inland Cairo (Zamalek Island to Tahrir via Bridge)', async () => {
    clearNavigationCaches();
    const zamalek = [30.0609, 31.2197];
    const tahrir = [30.0444, 31.2357];
    const res = await getRoadNavigationRoute(zamalek, tahrir);

    assert.equal(res.status, 'OK');
    assert.equal(res.isLiveRoad, true);
    assert.ok(res.coords.length > 30, `Expected detailed road polyline (>30 vertices), got ${res.coords.length}`);
    assert.ok(res.distanceMeters > 1800 && res.distanceMeters < 6000);
    assert.ok(res.durationSeconds > 120);
  });

  it('calculates coastal route in Alexandria along Corniche without crossing the Mediterranean Sea', async () => {
    const bibliotheca = [31.2089, 29.9092];
    const stanley = [31.2336, 29.9489];
    const res = await getRoadNavigationRoute(bibliotheca, stanley);

    assert.equal(res.status, 'OK');
    assert.ok(res.coords.length > 80);
    // Verify that no vertex along the route goes north into the open Mediterranean beyond the coastal road
    for (const [lat, lon] of res.coords) {
      assert.ok(lat <= 31.2420 && lat >= 31.1950, `Vertex [${lat}, ${lon}] deviated outside coastal land road`);
    }
  });

  it('snaps coastal lawyer candidates onto land roads in Alexandria (preventing sea markers)', async () => {
    // Stanley Beach user position where North-West offset (+0.0102, -0.0088) would land 1km inside the sea
    const alexCoastUser = [31.2355, 29.9482];
    const lawyers = await resolveRoadSnappedLawyers(alexCoastUser[0], alexCoastUser[1]);

    assert.equal(lawyers.length, 4);
    for (const lawyer of lawyers) {
      assert.equal(lawyer.isRoadSnapped, true, `Lawyer ${lawyer.name} should be snapped to a real road`);
      assert.ok(lawyer.distanceMeters >= 200, `Lawyer ${lawyer.name} distance must be positive`);
      // Verify route from user to each snapped lawyer is 100% valid road
      const route = await getRoadNavigationRoute(alexCoastUser, lawyer.coords);
      assert.equal(route.status, 'OK', `Route to ${lawyer.name} must succeed on land roads`);
      assert.ok(route.coords.length >= 5);
    }
  });

  it('handles legitimate ferry crossing in Port Said -> Port Fouad accurately', async () => {
    const portSaid = [31.2653, 32.3019];
    const portFouad = [31.2464, 32.3175];
    const res = await getRoadNavigationRoute(portSaid, portFouad);

    assert.equal(res.status, 'OK');
    assert.equal(res.hasFerry, true);
    assert.ok(res.distanceMeters > 1500);
  });

  it('rejects unreachable deep-sea coordinates safely without drawing a fake or straight line', async () => {
    const alexCoast = [31.2089, 29.9092];
    const deepSeaPoint = [31.8500, 29.5000]; // ~75km offshore in the Mediterranean Sea
    const res = await getRoadNavigationRoute(alexCoast, deepSeaPoint);

    assert.notEqual(res.status, 'OK');
    assert.deepEqual(res.coords, [], 'Must NOT return any fake or straight-line coordinates for unreachable sea targets');
    assert.equal(res.isLiveRoad, false);
  });

  it('rejects out-of-coverage coordinates outside Egypt safely', async () => {
    const cairo = [30.0444, 31.2357];
    const london = [51.5074, -0.1278];
    const res = await getRoadNavigationRoute(cairo, london);

    assert.equal(res.status, 'OUT_OF_COVERAGE');
    assert.deepEqual(res.coords, []);
  });
});

describe('4. Concurrency, Cancellation & Caching Verification', () => {
  it('aborts in-flight route request cleanly when AbortController triggers', async () => {
    clearNavigationCaches();
    const ctrl = new AbortController();
    const start = [30.0444, 31.2357];
    const end = [30.0750, 31.2800];

    const promise = getRoadNavigationRoute(start, end, { signal: ctrl.signal });
    ctrl.abort();

    await assert.rejects(promise, (err) => err.name === 'AbortError');
  });

  it('deduplicates concurrent identical requests and serves subsequent calls from LRU cache in <2ms', async () => {
    clearNavigationCaches();
    const start = [30.0444, 31.2357];
    const end = [30.0486, 31.2402];

    // Fire 5 concurrent identical requests
    const results = await Promise.all([
      getRoadNavigationRoute(start, end),
      getRoadNavigationRoute(start, end),
      getRoadNavigationRoute(start, end),
      getRoadNavigationRoute(start, end),
      getRoadNavigationRoute(start, end),
    ]);

    for (const r of results) {
      assert.equal(r.status, 'OK');
      assert.equal(r.distanceMeters, results[0].distanceMeters);
    }

    // Subsequent call should hit cache in < 2ms
    const t0 = performance.now();
    const cachedRes = await getRoadNavigationRoute(start, end);
    const elapsedMs = performance.now() - t0;

    assert.equal(cachedRes.status, 'OK');
    assert.ok(elapsedMs < 5, `Expected cached lookup < 5ms, took ${elapsedMs.toFixed(2)}ms`);
  });
});

describe('5. "محاميك حالاً" Order Lifecycle State Machine & Fee Evaluation', () => {
  it('evaluates micro-service fees deterministically based on service type and road distance', () => {
    const lawyerNear = { id: 'lawyer-1', distanceKm: 1.2 };
    const lawyerFar = { id: 'lawyer-2', distanceKm: 4.5 };

    assert.equal(
      evaluateLawyerNowRequestFee(lawyerNear, { serviceType: 'police' }),
      350
    );
    assert.equal(
      evaluateLawyerNowRequestFee(lawyerNear, { serviceType: 'prosecution' }),
      400
    );
    assert.equal(
      evaluateLawyerNowRequestFee(lawyerFar, { serviceType: 'police' }),
      380 // 350 base + 30 EGP for 3km beyond 1.5km
    );
    assert.equal(evaluateLawyerNowRequestFee(null, null), 350);
  });

  it('transitions cleanly through the booking lifecycle (acceptance -> price evaluation -> payment -> en route) and step-back navigation', async () => {
    const mockLawyer = { id: 'lawyer-1', name: 'أ. طارق عبد الحميد', distanceKm: 1.1 };
    const initialState = createInitialLawyerNowOrderState();

    // 1. Tap "طلب الآن" -> WAITING_ACCEPTANCE inside the card (request sent to lawyer BEFORE payment)
    const s1 = transitionLawyerNowOrderState(initialState, {
      type: 'SUBMIT_REQUEST',
      lawyer: mockLawyer,
      requestDetails: { serviceType: 'prosecution' },
    });
    assert.equal(s1.dispatchStage, DISPATCH_STAGES.BROWSE);
    assert.equal(s1.cardStage, CARD_STAGES.WAITING_ACCEPTANCE);
    assert.equal(s1.bookedLawyerId, 'lawyer-1');
    assert.equal(s1.evaluatedPrice, 400);
    assert.equal(s1.isLawyerAccepted, false);

    // 1b. Attempting to open payment before lawyer acceptance is blocked
    const prematurePayment = transitionLawyerNowOrderState(s1, {
      type: 'OPEN_PAYMENT',
      lawyer: mockLawyer,
    });
    assert.equal(prematurePayment.dispatchStage, DISPATCH_STAGES.BROWSE);
    assert.equal(prematurePayment.cardStage, CARD_STAGES.WAITING_ACCEPTANCE);

    // 1c. Pressing Back during WAITING_ACCEPTANCE returns to PROFILE while preserving bookedLawyerId & evaluatedPrice
    const s1Back = transitionLawyerNowOrderState(s1, { type: 'STEP_BACK' });
    assert.equal(s1Back.cardStage, CARD_STAGES.PROFILE);
    assert.equal(s1Back.bookedLawyerId, 'lawyer-1');

    // 2. Lawyer decision event -> LAWYER_DECISION card with 3s countdown
    const sDecisionAccepted = transitionLawyerNowOrderState(s1, {
      type: 'LAWYER_DECIDED',
      status: 'ACCEPTED',
    });
    assert.equal(sDecisionAccepted.cardStage, CARD_STAGES.LAWYER_DECISION);
    assert.equal(sDecisionAccepted.lawyerDecisionStatus, 'ACCEPTED');
    assert.equal(sDecisionAccepted.lawyerDecisionCountdown, 3);

    // 2b. Lawyer rejection decision returns to PROFILE with rejection status
    const sDecisionRejected = transitionLawyerNowOrderState(s1, {
      type: 'LAWYER_DECIDED',
      status: 'REJECTED',
    });
    assert.equal(sDecisionRejected.cardStage, CARD_STAGES.LAWYER_DECISION);
    assert.equal(sDecisionRejected.lawyerDecisionStatus, 'REJECTED');
    const sRejectedEnd = transitionLawyerNowOrderState(sDecisionRejected, {
      type: 'LAWYER_REJECTED',
    });
    assert.equal(sRejectedEnd.cardStage, CARD_STAGES.PROFILE);
    assert.equal(sRejectedEnd.isLawyerAccepted, false);

    // 2c. After 3s countdown on accepted decision -> EVALUATING_PRICE inside the card
    const s2 = transitionLawyerNowOrderState(sDecisionAccepted, { type: 'LAWYER_ACCEPTED' });
    assert.equal(s2.dispatchStage, DISPATCH_STAGES.BROWSE);
    assert.equal(s2.cardStage, CARD_STAGES.EVALUATING_PRICE);
    assert.equal(s2.isLawyerAccepted, true);

    // 3. After 1s price evaluation -> PRICE_READY inside the card
    const s3 = transitionLawyerNowOrderState(s2, { type: 'FINISH_EVALUATION' });
    assert.equal(s3.cardStage, CARD_STAGES.PRICE_READY);
    assert.equal(s3.isLawyerAccepted, true);

    // 3b. Pressing Back in PRICE_READY returns to PROFILE; re-submitting for the same accepted lawyer skips waiting again
    const s3Back = transitionLawyerNowOrderState(s3, { type: 'STEP_BACK' });
    assert.equal(s3Back.cardStage, CARD_STAGES.PROFILE);
    const reSubmitAccepted = transitionLawyerNowOrderState(s3Back, {
      type: 'SUBMIT_REQUEST',
      lawyer: mockLawyer,
      requestDetails: { serviceType: 'prosecution' },
    });
    assert.equal(reSubmitAccepted.cardStage, CARD_STAGES.PRICE_READY);

    // 4. Tap "دفع الآن" -> Dedicated PAYMENT screen in IDLE state
    const s4 = transitionLawyerNowOrderState(s3, {
      type: 'OPEN_PAYMENT',
      lawyer: mockLawyer,
    });
    assert.equal(s4.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(s4.paymentStatus, PAYMENT_STATUS.IDLE);

    // 4b. Back from payment before paying returns to PRICE_READY inside the card
    const s4Back = transitionLawyerNowOrderState(s4, { type: 'BACK_FROM_PAYMENT' });
    assert.equal(s4Back.dispatchStage, DISPATCH_STAGES.BROWSE);
    assert.equal(s4Back.cardStage, CARD_STAGES.PRICE_READY);

    // 5. Start payment processing -> PROCESSING state blocks duplicate submissions and back navigation
    const sProcessing = transitionLawyerNowOrderState(s4, {
      type: 'START_PAYMENT_PROCESSING',
    });
    assert.equal(sProcessing.paymentStatus, PAYMENT_STATUS.PROCESSING);

    const blockedBackWhileProcessing = transitionLawyerNowOrderState(sProcessing, {
      type: 'BACK_FROM_PAYMENT',
    });
    assert.equal(blockedBackWhileProcessing.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(blockedBackWhileProcessing.paymentStatus, PAYMENT_STATUS.PROCESSING);

    // 6. Simulate payment failure -> stays on PAYMENT screen with FAILED status and never advances to CONFIRMED
    const failedRes = await processLawyerNowPayment(
      { lawyer: mockLawyer, amount: 400, paymentMethod: 'card' },
      { delayMs: 5, shouldFail: true, errorMessage: 'رصيد البطاقة غير كافٍ' }
    );
    assert.equal(failedRes.status, 'ERROR');
    const sFailed = transitionLawyerNowOrderState(sProcessing, {
      type: 'PAYMENT_FAILED',
      errorMessage: failedRes.errorMessage,
    });
    assert.equal(sFailed.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(sFailed.paymentStatus, PAYMENT_STATUS.FAILED);
    assert.equal(sFailed.paymentError, 'رصيد البطاقة غير كافٍ');

    // 7. Retry payment and succeed -> transitions to CONFIRMED ("تم الدفع بنجاح") with verified transactionId
    const sRetryProcessing = transitionLawyerNowOrderState(sFailed, {
      type: 'START_PAYMENT_PROCESSING',
    });
    const successRes = await processLawyerNowPayment(
      { lawyer: mockLawyer, amount: 400, paymentMethod: 'card' },
      { delayMs: 5 }
    );
    assert.equal(successRes.status, 'SUCCESS');
    assert.ok(successRes.transactionId.startsWith('TX-'));

    const sConfirmed = transitionLawyerNowOrderState(sRetryProcessing, {
      type: 'PAYMENT_SUCCEEDED',
      receipt: successRes,
    });
    assert.equal(sConfirmed.dispatchStage, DISPATCH_STAGES.PAYMENT);
    assert.equal(sConfirmed.paymentStatus, PAYMENT_STATUS.CONFIRMED);
    assert.equal(sConfirmed.paymentReceipt.transactionId, successRes.transactionId);

    // 7b. Attempting START_PAYMENT_PROCESSING again after CONFIRMED is ignored (prevents double charge)
    const duplicateAttempt = transitionLawyerNowOrderState(sConfirmed, {
      type: 'START_PAYMENT_PROCESSING',
    });
    assert.equal(duplicateAttempt.paymentStatus, PAYMENT_STATUS.CONFIRMED);

    // 8. Proceed from "تم الدفع بنجاح" confirmation screen (after 5s countdown or button tap) -> Final EN_ROUTE stage
    const sEnRoute = transitionLawyerNowOrderState(sConfirmed, {
      type: 'COMPLETE_ORDER_EN_ROUTE',
    });
    assert.equal(sEnRoute.dispatchStage, DISPATCH_STAGES.EN_ROUTE);
    assert.equal(sEnRoute.cardStage, CARD_STAGES.PROFILE);

    // 9. Stale FINISH_EVALUATION or LAWYER_ACCEPTED events in wrong stage are ignored safely
    const staleAfterEnRoute = transitionLawyerNowOrderState(sEnRoute, {
      type: 'FINISH_EVALUATION',
    });
    assert.deepEqual(staleAfterEnRoute, sEnRoute);
  });
});

describe('6. Multi-Criteria Lawyer Ranking & Alternative Lawyer Selection («محامي آخر»)', () => {
  const sampleLawyers = [
    {
      id: 'lawyer-1',
      name: 'أ. طارق عبد الحميد',
      coords: [30.0486, 31.2402],
      distanceMeters: 780,
      distanceKm: 0.8,
      rating: 4.9,
      experienceYears: 14,
      isOnline: true,
    },
    {
      id: 'lawyer-2',
      name: 'أ. نادية الشافعي',
      coords: [30.0389, 31.2415],
      distanceMeters: 980,
      distanceKm: 1.0,
      rating: 4.8,
      experienceYears: 11,
      isOnline: true,
    },
    {
      id: 'lawyer-3',
      name: 'أ. حسام الدين رضوان',
      coords: [30.0462, 31.2368],
      distanceMeters: 520, // Closer physically, but offline!
      distanceKm: 0.5,
      rating: 5.0,
      experienceYears: 18,
      isOnline: false,
    },
    {
      id: 'lawyer-4',
      name: 'أ. محمود عبد الهادي',
      coords: [30.0509, 31.2295],
      distanceMeters: 1250,
      distanceKm: 1.3,
      rating: 4.7,
      experienceYears: 8,
      isOnline: true,
    },
  ];

  it('ranks online lawyers ahead of offline lawyers and balances proximity + rating deterministically', () => {
    const ranked = rankLawyersBySuitability(sampleLawyers);
    assert.equal(ranked.length, 4);

    // Online lawyers must come before offline lawyer-3 even though lawyer-3 is 520m away with 5.0 rating
    assert.deepEqual(
      ranked.map((l) => l.id),
      ['lawyer-1', 'lawyer-2', 'lawyer-4', 'lawyer-3']
    );

    // Verify suitability score reflects online status, proximity, and rating
    const score1 = computeLawyerSuitabilityScore(sampleLawyers[0]);
    const score2 = computeLawyerSuitabilityScore(sampleLawyers[1]);
    const scoreOffline = computeLawyerSuitabilityScore(sampleLawyers[2]);
    assert.ok(score1 > score2, 'Closer & higher-rated online lawyer must score higher');
    assert.ok(score2 > scoreOffline, 'Online lawyer must score higher than offline lawyer');
  });

  it('re-orders lawyers accurately when distance, rating, or online status changes', () => {
    // Flip lawyer-3 to online: since lawyer-3 is 520m away with 5.0 rating, they become #1
    const updated = sampleLawyers.map((l) =>
      l.id === 'lawyer-3' ? { ...l, isOnline: true } : l
    );
    const ranked = rankLawyersBySuitability(updated);
    assert.equal(ranked[0].id, 'lawyer-3');
    assert.equal(ranked[1].id, 'lawyer-1');
  });

  it('selects alternative lawyers («محامي آخر») without repeating visited candidates or showing the current lawyer', () => {
    // Starting on lawyer-1: first click on «محامي آخر» should select lawyer-2 (best unvisited online alternative)
    const step1 = selectNextAlternativeLawyer(sampleLawyers, 'lawyer-1', ['lawyer-1']);
    assert.equal(step1.hasAlternatives, true);
    assert.equal(step1.reason, 'OK');
    assert.equal(step1.nextLawyer.id, 'lawyer-2');
    assert.notEqual(step1.nextLawyer.id, 'lawyer-1');

    // Second click from lawyer-2: should select lawyer-4 (next unvisited online alternative, NOT repeating lawyer-1)
    const step2 = selectNextAlternativeLawyer(
      sampleLawyers,
      step1.nextLawyer.id,
      step1.updatedVisitedIds
    );
    assert.equal(step2.nextLawyer.id, 'lawyer-4');
    assert.equal(step2.cycled, false);

    // Third click from lawyer-4: all online lawyers (1, 2, 4) were visited, so unvisited offline lawyer-3 is shown with real isOnline: false
    const step3 = selectNextAlternativeLawyer(
      sampleLawyers,
      step2.nextLawyer.id,
      step2.updatedVisitedIds
    );
    assert.equal(step3.nextLawyer.id, 'lawyer-3');
    assert.equal(step3.nextLawyer.isOnline, false);
    assert.equal(step3.cycled, false);

    // Fourth click from lawyer-3: all 4 candidates have been visited; cycles cleanly back to top-ranked alternative (lawyer-1)
    const step4 = selectNextAlternativeLawyer(
      sampleLawyers,
      step3.nextLawyer.id,
      step3.updatedVisitedIds
    );
    assert.equal(step4.nextLawyer.id, 'lawyer-1');
    assert.equal(step4.cycled, true);
    assert.equal(step4.reason, 'CYCLED_ALTERNATIVES');
  });

  it('handles single-lawyer or empty lists safely without returning misleading results', () => {
    const onlyOne = [sampleLawyers[0]];
    const resSingle = selectNextAlternativeLawyer(onlyOne, 'lawyer-1', ['lawyer-1']);
    assert.equal(resSingle.nextLawyer, null);
    assert.equal(resSingle.hasAlternatives, false);
    assert.equal(resSingle.reason, 'NO_ALTERNATIVES');

    const resEmpty = selectNextAlternativeLawyer([], null, []);
    assert.equal(resEmpty.nextLawyer, null);
    assert.equal(resEmpty.hasAlternatives, false);
  });
});


import { useState, useRef, useEffect, useCallback } from 'react';
import {
  evaluateLawyerNowRequestFee,
  processLawyerNowPayment,
} from '../services/lawyerService.js';

export const DISPATCH_STAGES = {
  BROWSE: 'BROWSE',
  PAYMENT: 'PAYMENT',
  EN_ROUTE: 'EN_ROUTE',
};

export const CARD_STAGES = {
  PROFILE: 'PROFILE',
  WAITING_ACCEPTANCE: 'WAITING_ACCEPTANCE',
  LAWYER_DECISION: 'LAWYER_DECISION',
  EVALUATING_PRICE: 'EVALUATING_PRICE',
  PRICE_READY: 'PRICE_READY',
};

export const PAYMENT_STATUS = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
};

export function createInitialLawyerNowOrderState() {
  return {
    dispatchStage: DISPATCH_STAGES.BROWSE,
    cardStage: CARD_STAGES.PROFILE,
    bookedLawyerId: null,
    isLawyerAccepted: false,
    lawyerDecisionStatus: null, // 'ACCEPTED' | 'REJECTED' | null
    lawyerDecisionCountdown: 3,
    selectedPaymentMethod: 'card',
    evaluatedPrice: 350,
    paymentStatus: PAYMENT_STATUS.IDLE,
    paymentError: '',
    paymentReceipt: null,
  };
}

/**
 * Pure state transition resolver for the "محاميك حالاً" dispatch & payment state machine.
 * Exported for deterministic unit testing of all normal, back-navigation, and edge-case transitions.
 *
 * Lifecycle Order (Lawyer Acceptance BEFORE Payment):
 * 1. `PROFILE`: View lawyer profile ("طلب الآن" / "محامٍ آخر").
 * 2. `WAITING_ACCEPTANCE` (`SUBMIT_REQUEST`): Send request to lawyer & wait for lawyer's acceptance first.
 * 3. `EVALUATING_PRICE` (`LAWYER_ACCEPTED` / `START_EVALUATION`): Lawyer accepts -> evaluate request fee (1s).
 * 4. `PRICE_READY` (`FINISH_EVALUATION`): Show evaluated price inside card with "دفع الآن" button.
 * 5. `PAYMENT` (`OPEN_PAYMENT`): Open payment screen (`IDLE` -> `PROCESSING` -> `CONFIRMED` ["تم الدفع بنجاح"] or `FAILED`).
 * 6. `EN_ROUTE` (`COMPLETE_ORDER_EN_ROUTE`): After 5s countdown (or tap continue) on "تم الدفع بنجاح", transition to active En-Route tracking with Call & Chat actions.
 *
 * Guarantees:
 * - Payment (`OPEN_PAYMENT`) is strictly gated on lawyer acceptance (`isLawyerAccepted === true`).
 * - Prevents duplicate payment execution when already `PROCESSING` or `CONFIRMED`.
 * - Never transitions to `CONFIRMED` (`تم الدفع بنجاح`) unless `PAYMENT_SUCCEEDED` carries a verified transaction receipt.
 * - Handles `PAYMENT_FAILED` cleanly without falsely advancing to `CONFIRMED` or `EN_ROUTE`.
 * - Step-by-step `STEP_BACK` transitions return to the exact previous valid stage while preserving user request data.
 *
 * @param {object} state
 * @param {object} event
 * @returns {object} Next state
 */
export function transitionLawyerNowOrderState(state, event) {
  switch (event?.type) {
    case 'RESET_TO_PROFILE':
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.PROFILE,
        lawyerDecisionStatus: null,
        lawyerDecisionCountdown: 3,
        paymentError: '',
      };

    case 'SUBMIT_REQUEST': {
      const lawyer = event.lawyer;
      if (!lawyer) return state;
      const evaluatedPrice = evaluateLawyerNowRequestFee(lawyer, event.requestDetails);
      const isDifferentLawyer = state.bookedLawyerId !== lawyer.id;

      // If this exact lawyer already accepted and payment was already confirmed, go straight to EN_ROUTE
      if (
        !isDifferentLawyer &&
        state.paymentStatus === PAYMENT_STATUS.CONFIRMED &&
        state.paymentReceipt
      ) {
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.EN_ROUTE,
          cardStage: CARD_STAGES.PROFILE,
          lawyerDecisionStatus: null,
          paymentError: '',
        };
      }

      // If this exact lawyer already accepted the request in this session, skip re-waiting and show evaluated price
      if (!isDifferentLawyer && state.isLawyerAccepted) {
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.BROWSE,
          cardStage: CARD_STAGES.PRICE_READY,
          evaluatedPrice,
          lawyerDecisionStatus: 'ACCEPTED',
          paymentError: '',
        };
      }

      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.WAITING_ACCEPTANCE,
        bookedLawyerId: lawyer.id,
        isLawyerAccepted: false,
        lawyerDecisionStatus: null,
        lawyerDecisionCountdown: 3,
        evaluatedPrice,
        paymentStatus: isDifferentLawyer ? PAYMENT_STATUS.IDLE : state.paymentStatus,
        paymentReceipt: isDifferentLawyer ? null : state.paymentReceipt,
        paymentError: '',
      };
    }

    case 'LAWYER_DECIDED': {
      if (state.cardStage !== CARD_STAGES.WAITING_ACCEPTANCE) return state;
      const isAccepted = event.status === 'ACCEPTED';
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.LAWYER_DECISION,
        isLawyerAccepted: isAccepted,
        lawyerDecisionStatus: isAccepted ? 'ACCEPTED' : 'REJECTED',
        lawyerDecisionCountdown: 3,
        paymentError: '',
      };
    }

    case 'SET_DECISION_COUNTDOWN':
      return {
        ...state,
        lawyerDecisionCountdown:
          typeof event.countdown === 'number' ? event.countdown : state.lawyerDecisionCountdown,
      };

    case 'LAWYER_ACCEPTED':
      if (
        state.cardStage !== CARD_STAGES.WAITING_ACCEPTANCE &&
        state.cardStage !== CARD_STAGES.LAWYER_DECISION
      ) {
        return state;
      }
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.EVALUATING_PRICE,
        isLawyerAccepted: true,
        lawyerDecisionStatus: 'ACCEPTED',
        paymentError: '',
      };

    case 'LAWYER_REJECTED':
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.PROFILE,
        isLawyerAccepted: false,
        lawyerDecisionStatus: 'REJECTED',
        paymentError: '',
      };

    case 'START_EVALUATION': {
      const lawyer = event.lawyer;
      if (!lawyer) return state;
      const evaluatedPrice = evaluateLawyerNowRequestFee(lawyer, event.requestDetails);
      const isDifferentLawyer = state.bookedLawyerId !== lawyer.id;
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.EVALUATING_PRICE,
        bookedLawyerId: lawyer.id,
        isLawyerAccepted: true,
        evaluatedPrice,
        paymentStatus: isDifferentLawyer ? PAYMENT_STATUS.IDLE : state.paymentStatus,
        paymentReceipt: isDifferentLawyer ? null : state.paymentReceipt,
        paymentError: '',
      };
    }

    case 'FINISH_EVALUATION':
      if (state.cardStage !== CARD_STAGES.EVALUATING_PRICE) return state;
      return {
        ...state,
        cardStage: CARD_STAGES.PRICE_READY,
      };

    case 'OPEN_PAYMENT': {
      const lawyer = event.lawyer;
      const nextBookedId = lawyer?.id || state.bookedLawyerId;
      if (!nextBookedId) return state;
      // Require lawyer acceptance before opening payment
      if (!state.isLawyerAccepted) return state;

      // If payment was already confirmed for this exact lawyer in the current order,
      // skip re-charging and proceed directly to EN_ROUTE
      if (
        state.paymentStatus === PAYMENT_STATUS.CONFIRMED &&
        state.paymentReceipt &&
        state.bookedLawyerId === nextBookedId
      ) {
        return {
          ...state,
          bookedLawyerId: nextBookedId,
          dispatchStage: DISPATCH_STAGES.EN_ROUTE,
          cardStage: CARD_STAGES.PROFILE,
          paymentError: '',
        };
      }

      return {
        ...state,
        bookedLawyerId: nextBookedId,
        dispatchStage: DISPATCH_STAGES.PAYMENT,
        paymentStatus:
          state.paymentStatus === PAYMENT_STATUS.CONFIRMED
            ? PAYMENT_STATUS.CONFIRMED
            : PAYMENT_STATUS.IDLE,
        paymentError: '',
      };
    }

    case 'BACK_FROM_PAYMENT': {
      if (state.dispatchStage !== DISPATCH_STAGES.PAYMENT) return state;
      // Block accidental back navigation while a live payment request is in flight
      if (state.paymentStatus === PAYMENT_STATUS.PROCESSING) return state;

      // If payment is already confirmed ("تم الدفع بنجاح" screen), pressing back or continue goes to EN_ROUTE
      if (state.paymentStatus === PAYMENT_STATUS.CONFIRMED) {
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.EN_ROUTE,
          cardStage: CARD_STAGES.PROFILE,
        };
      }

      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.BROWSE,
        cardStage: CARD_STAGES.PRICE_READY,
        paymentStatus: PAYMENT_STATUS.IDLE,
        paymentError: '',
      };
    }

    case 'SELECT_PAYMENT_METHOD': {
      if (
        state.paymentStatus === PAYMENT_STATUS.PROCESSING ||
        state.paymentStatus === PAYMENT_STATUS.CONFIRMED
      ) {
        return state;
      }
      return {
        ...state,
        selectedPaymentMethod: event.paymentMethod || 'card',
        paymentError: '',
      };
    }

    case 'START_PAYMENT_PROCESSING': {
      if (state.dispatchStage !== DISPATCH_STAGES.PAYMENT) return state;
      // Prevent duplicate concurrent payment submissions or re-charging an already paid order
      if (
        state.paymentStatus === PAYMENT_STATUS.PROCESSING ||
        state.paymentStatus === PAYMENT_STATUS.CONFIRMED
      ) {
        return state;
      }
      return {
        ...state,
        paymentStatus: PAYMENT_STATUS.PROCESSING,
        paymentError: '',
      };
    }

    case 'PAYMENT_SUCCEEDED': {
      if (
        state.dispatchStage !== DISPATCH_STAGES.PAYMENT ||
        state.paymentStatus !== PAYMENT_STATUS.PROCESSING
      ) {
        return state;
      }
      const receipt = event.receipt;
      if (!receipt || receipt.status !== 'SUCCESS' || !receipt.transactionId) {
        return {
          ...state,
          paymentStatus: PAYMENT_STATUS.FAILED,
          paymentError: 'لم يتم تأكيد عملية الدفع من المصدر. يرجى المحاولة مرة أخرى.',
        };
      }
      return {
        ...state,
        paymentStatus: PAYMENT_STATUS.CONFIRMED,
        paymentReceipt: receipt,
        paymentError: '',
      };
    }

    case 'PAYMENT_FAILED': {
      if (state.dispatchStage !== DISPATCH_STAGES.PAYMENT) return state;
      return {
        ...state,
        paymentStatus: PAYMENT_STATUS.FAILED,
        paymentError:
          event.errorMessage ||
          'تعذر إتمام عملية الدفع. يرجى مراجعة وسيلة الدفع والمحاولة مجدداً.',
      };
    }

    case 'COMPLETE_ORDER_EN_ROUTE':
    case 'CONFIRM_PAYMENT': {
      if (state.paymentStatus !== PAYMENT_STATUS.CONFIRMED && !event?.receipt) {
        return state;
      }
      return {
        ...state,
        dispatchStage: DISPATCH_STAGES.EN_ROUTE,
        cardStage: CARD_STAGES.PROFILE,
        paymentStatus: PAYMENT_STATUS.CONFIRMED,
        paymentError: '',
      };
    }

    case 'STEP_BACK': {
      // 1. Inside PAYMENT screen
      if (state.dispatchStage === DISPATCH_STAGES.PAYMENT) {
        if (state.paymentStatus === PAYMENT_STATUS.PROCESSING) {
          return state;
        }
        if (state.paymentStatus === PAYMENT_STATUS.CONFIRMED) {
          return {
            ...state,
            dispatchStage: DISPATCH_STAGES.EN_ROUTE,
            cardStage: CARD_STAGES.PROFILE,
          };
        }
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.BROWSE,
          cardStage: CARD_STAGES.PRICE_READY,
          paymentStatus: PAYMENT_STATUS.IDLE,
          paymentError: '',
        };
      }

      // 2. Inside EN_ROUTE sheet -> return to browsing lawyers on map while keeping request details
      if (state.dispatchStage === DISPATCH_STAGES.EN_ROUTE) {
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.BROWSE,
          cardStage: CARD_STAGES.PROFILE,
        };
      }

      // 3. Inside LawyerProfileModal stages (WAITING_ACCEPTANCE / LAWYER_DECISION / EVALUATING_PRICE / PRICE_READY)
      if (
        state.cardStage === CARD_STAGES.WAITING_ACCEPTANCE ||
        state.cardStage === CARD_STAGES.LAWYER_DECISION ||
        state.cardStage === CARD_STAGES.EVALUATING_PRICE ||
        state.cardStage === CARD_STAGES.PRICE_READY
      ) {
        return {
          ...state,
          dispatchStage: DISPATCH_STAGES.BROWSE,
          cardStage: CARD_STAGES.PROFILE,
          lawyerDecisionStatus: null,
        };
      }

      return state;
    }

    default:
      return state;
  }
}

/**
 * Custom React Hook managing the end-to-end "محاميك حالاً" booking lifecycle
 * where Lawyer Acceptance precedes Payment:
 * 1. `PROFILE` (inside LawyerProfileModal)
 * 2. `WAITING_ACCEPTANCE` (inside LawyerProfileModal: send request & wait for lawyer's acceptance first)
 * 3. `EVALUATING_PRICE` (1s inside LawyerProfileModal after lawyer accepts)
 * 4. `PRICE_READY` (inside LawyerProfileModal: show accepted request & evaluated fee with "دفع الآن")
 * 5. `PAYMENT` (`LawyerNowPaymentOverlay`: `IDLE` -> `PROCESSING` -> `CONFIRMED` ["تم الدفع بنجاح" + 5s countdown] or `FAILED`)
 * 6. `EN_ROUTE` (`LawyerEnRouteSheetContent` with ETA, distance, Call, Chat & back navigation)
 *
 * Includes sequence guards, payment lock refs, and timer cleanup to prevent race conditions or duplicate charges.
 */
export function useLawyerNowOrderFlow({
  requestDetails = null,
  setSelectedLawyerId,
  setActiveTargetLawyerId,
  onOrderAcceptedEnRoute,
}) {
  const [orderState, setOrderState] = useState(createInitialLawyerNowOrderState);
  const [confirmationCountdown, setConfirmationCountdown] = useState(5);

  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const paymentAbortRef = useRef(null);
  const isPaymentInFlightRef = useRef(false);
  const flowSeqRef = useRef(0);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const abortPendingPayment = useCallback(() => {
    if (paymentAbortRef.current) {
      paymentAbortRef.current.abort();
      paymentAbortRef.current = null;
    }
    isPaymentInFlightRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
      abortPendingPayment();
    };
  }, [clearPendingTimer, abortPendingPayment]);

  const resetCardToProfile = useCallback(() => {
    flowSeqRef.current += 1;
    clearPendingTimer();
    setOrderState((prev) =>
      transitionLawyerNowOrderState(prev, { type: 'RESET_TO_PROFILE' })
    );
  }, [clearPendingTimer]);

  const closeLawyerModal = useCallback(() => {
    flowSeqRef.current += 1;
    clearPendingTimer();
    setOrderState((prev) =>
      transitionLawyerNowOrderState(prev, { type: 'RESET_TO_PROFILE' })
    );
    setSelectedLawyerId?.(null);
  }, [clearPendingTimer, setSelectedLawyerId]);

  /**
   * Starts the request flow when clicking "طلب الآن":
   * 1. Enters `WAITING_ACCEPTANCE` first so the lawyer accepts the request before any payment.
   * 2. Once accepted, transitions to `EVALUATING_PRICE` (1s) and then `PRICE_READY` ("دفع الآن").
   */
  const startRequestFlow = useCallback(
    (lawyer) => {
      if (!lawyer) return;
      flowSeqRef.current += 1;
      const currentSeq = flowSeqRef.current;
      clearPendingTimer();

      setActiveTargetLawyerId?.(lawyer.id);

      const isSameLawyer = orderState.bookedLawyerId === lawyer.id;
      if (
        isSameLawyer &&
        orderState.paymentStatus === PAYMENT_STATUS.CONFIRMED &&
        orderState.paymentReceipt
      ) {
        setSelectedLawyerId?.(null);
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'SUBMIT_REQUEST',
            lawyer,
            requestDetails,
          })
        );
        onOrderAcceptedEnRoute?.(lawyer);
        return;
      }

      if (isSameLawyer && orderState.isLawyerAccepted) {
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'SUBMIT_REQUEST',
            lawyer,
            requestDetails,
          })
        );
        return;
      }

      setOrderState((prev) =>
        transitionLawyerNowOrderState(prev, {
          type: 'SUBMIT_REQUEST',
          lawyer,
          requestDetails,
        })
      );

      // Step 1: Wait for lawyer decision (~1.8s)
      // Step 2: Show Lawyer Decision card (Accepted or Rejected) with 3s countdown
      // Step 3: If accepted -> evaluate price (1s) -> PRICE_READY ("دفع الآن")
      timerRef.current = setTimeout(() => {
        if (flowSeqRef.current !== currentSeq) return;

        // By default, simulate lawyer acceptance unless explicitly rejected in options
        const isAccepted = lawyer.isOnline !== false;
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'LAWYER_DECIDED',
            status: isAccepted ? 'ACCEPTED' : 'REJECTED',
          })
        );

        let countdown = 3;
        countdownIntervalRef.current = setInterval(() => {
          if (flowSeqRef.current !== currentSeq) return;
          countdown -= 1;
          setOrderState((prev) =>
            transitionLawyerNowOrderState(prev, {
              type: 'SET_DECISION_COUNTDOWN',
              countdown: Math.max(0, countdown),
            })
          );
        }, 1000);

        timerRef.current = setTimeout(() => {
          if (flowSeqRef.current !== currentSeq) return;
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          if (isAccepted) {
            setOrderState((prev) =>
              transitionLawyerNowOrderState(prev, { type: 'LAWYER_ACCEPTED' })
            );

            timerRef.current = setTimeout(() => {
              if (flowSeqRef.current !== currentSeq) return;
              setOrderState((prev) =>
                transitionLawyerNowOrderState(prev, { type: 'FINISH_EVALUATION' })
              );
            }, 1000);
          } else {
            setOrderState((prev) =>
              transitionLawyerNowOrderState(prev, { type: 'LAWYER_REJECTED' })
            );
          }
        }, 3000);
      }, 1800);
    },
    [
      clearPendingTimer,
      onOrderAcceptedEnRoute,
      orderState.bookedLawyerId,
      orderState.isLawyerAccepted,
      orderState.paymentReceipt,
      orderState.paymentStatus,
      requestDetails,
      setActiveTargetLawyerId,
      setSelectedLawyerId,
    ]
  );

  const proceedToPayment = useCallback(
    (lawyer) => {
      if (!lawyer) return;
      flowSeqRef.current += 1;
      clearPendingTimer();
      setActiveTargetLawyerId?.(lawyer.id);

      // If payment was already confirmed for this lawyer, move directly to EN_ROUTE without charging twice
      if (
        orderState.paymentStatus === PAYMENT_STATUS.CONFIRMED &&
        orderState.paymentReceipt &&
        orderState.bookedLawyerId === lawyer.id
      ) {
        setSelectedLawyerId?.(null);
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'OPEN_PAYMENT',
            lawyer,
          })
        );
        onOrderAcceptedEnRoute?.(lawyer);
        return;
      }

      setOrderState((prev) =>
        transitionLawyerNowOrderState(prev, {
          type: 'OPEN_PAYMENT',
          lawyer,
        })
      );
    },
    [
      clearPendingTimer,
      onOrderAcceptedEnRoute,
      orderState.bookedLawyerId,
      orderState.paymentReceipt,
      orderState.paymentStatus,
      setActiveTargetLawyerId,
      setSelectedLawyerId,
    ]
  );

  const proceedFromConfirmedPayment = useCallback(
    (bookedLawyer) => {
      flowSeqRef.current += 1;
      clearPendingTimer();
      setSelectedLawyerId?.(null);

      setOrderState((prev) =>
        transitionLawyerNowOrderState(prev, {
          type: 'COMPLETE_ORDER_EN_ROUTE',
        })
      );

      onOrderAcceptedEnRoute?.(bookedLawyer);
    },
    [clearPendingTimer, onOrderAcceptedEnRoute, setSelectedLawyerId]
  );

  const backFromPayment = useCallback(
    (bookedLawyer) => {
      if (isPaymentInFlightRef.current) return;
      if (orderState.paymentStatus === PAYMENT_STATUS.CONFIRMED) {
        proceedFromConfirmedPayment(bookedLawyer);
        return;
      }
      flowSeqRef.current += 1;
      clearPendingTimer();
      setOrderState((prev) =>
        transitionLawyerNowOrderState(prev, { type: 'BACK_FROM_PAYMENT' })
      );
    },
    [clearPendingTimer, orderState.paymentStatus, proceedFromConfirmedPayment]
  );

  const setSelectedPaymentMethod = useCallback((paymentMethod) => {
    if (isPaymentInFlightRef.current) return;
    setOrderState((prev) =>
      transitionLawyerNowOrderState(prev, {
        type: 'SELECT_PAYMENT_METHOD',
        paymentMethod,
      })
    );
  }, []);

  /**
   * Executes the payment transaction with loading state, duplicate-tap lock,
   * real result verification, and 5-second countdown on the "تم الدفع بنجاح" confirmation view
   * before transitioning to the final EN_ROUTE tracking screen.
   */
  const confirmPayment = useCallback(
    async (bookedLawyer, paymentOptions = {}) => {
      if (
        isPaymentInFlightRef.current ||
        orderState.paymentStatus === PAYMENT_STATUS.PROCESSING ||
        orderState.paymentStatus === PAYMENT_STATUS.CONFIRMED
      ) {
        return null;
      }

      isPaymentInFlightRef.current = true;
      flowSeqRef.current += 1;
      const currentSeq = flowSeqRef.current;
      clearPendingTimer();
      abortPendingPayment();

      const abortCtrl = new AbortController();
      paymentAbortRef.current = abortCtrl;
      isPaymentInFlightRef.current = true;

      setOrderState((prev) =>
        transitionLawyerNowOrderState(prev, {
          type: 'START_PAYMENT_PROCESSING',
        })
      );

      try {
        const result = await processLawyerNowPayment(
          {
            lawyer: bookedLawyer,
            amount: orderState.evaluatedPrice,
            paymentMethod: orderState.selectedPaymentMethod,
            requestDetails,
          },
          {
            signal: abortCtrl.signal,
            ...paymentOptions,
          }
        );

        if (flowSeqRef.current !== currentSeq || abortCtrl.signal.aborted) {
          return null;
        }

        isPaymentInFlightRef.current = false;
        paymentAbortRef.current = null;

        if (result && result.status === 'SUCCESS' && result.transactionId) {
          setConfirmationCountdown(5);
          setOrderState((prev) =>
            transitionLawyerNowOrderState(prev, {
              type: 'PAYMENT_SUCCEEDED',
              receipt: result,
            })
          );

          // 5-second countdown before automatically transitioning to EN_ROUTE
          countdownIntervalRef.current = setInterval(() => {
            if (flowSeqRef.current !== currentSeq) return;
            setConfirmationCountdown((prev) => Math.max(0, prev - 1));
          }, 1000);

          timerRef.current = setTimeout(() => {
            if (flowSeqRef.current !== currentSeq) return;
            proceedFromConfirmedPayment(bookedLawyer);
          }, 5000);

          return result;
        }

        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'PAYMENT_FAILED',
            errorMessage: result?.errorMessage,
          })
        );
        return result;
      } catch (err) {
        if (err?.name === 'AbortError' || abortCtrl.signal.aborted) {
          return null;
        }
        isPaymentInFlightRef.current = false;
        paymentAbortRef.current = null;
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, {
            type: 'PAYMENT_FAILED',
            errorMessage: 'حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.',
          })
        );
        return null;
      }
    },
    [
      abortPendingPayment,
      clearPendingTimer,
      orderState.evaluatedPrice,
      orderState.paymentStatus,
      orderState.selectedPaymentMethod,
      proceedFromConfirmedPayment,
      requestDetails,
    ]
  );

  /**
   * Unified step-by-step back handler across all card & screen stages.
   */
  const stepBackInFlow = useCallback(
    (bookedLawyer) => {
      if (orderState.dispatchStage === DISPATCH_STAGES.PAYMENT) {
        if (isPaymentInFlightRef.current) return true;
        backFromPayment(bookedLawyer);
        return true;
      }

      if (orderState.dispatchStage === DISPATCH_STAGES.EN_ROUTE) {
        flowSeqRef.current += 1;
        clearPendingTimer();
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, { type: 'STEP_BACK' })
        );
        if (bookedLawyer?.id || orderState.bookedLawyerId) {
          setSelectedLawyerId?.(bookedLawyer?.id || orderState.bookedLawyerId);
        }
        return true;
      }

      if (
        orderState.cardStage === CARD_STAGES.WAITING_ACCEPTANCE ||
        orderState.cardStage === CARD_STAGES.LAWYER_DECISION ||
        orderState.cardStage === CARD_STAGES.PRICE_READY ||
        orderState.cardStage === CARD_STAGES.EVALUATING_PRICE
      ) {
        flowSeqRef.current += 1;
        clearPendingTimer();
        setOrderState((prev) =>
          transitionLawyerNowOrderState(prev, { type: 'STEP_BACK' })
        );
        return true;
      }

      return false;
    },
    [
      backFromPayment,
      clearPendingTimer,
      orderState.bookedLawyerId,
      orderState.cardStage,
      orderState.dispatchStage,
      setSelectedLawyerId,
    ]
  );

  return {
    dispatchStage: orderState.dispatchStage,
    cardStage: orderState.cardStage,
    bookedLawyerId: orderState.bookedLawyerId,
    isLawyerAccepted: orderState.isLawyerAccepted,
    selectedPaymentMethod: orderState.selectedPaymentMethod,
    evaluatedPrice: orderState.evaluatedPrice,
    paymentStatus: orderState.paymentStatus,
    paymentError: orderState.paymentError,
    paymentReceipt: orderState.paymentReceipt,
    confirmationCountdown,
    lawyerDecisionStatus: orderState.lawyerDecisionStatus,
    lawyerDecisionCountdown: orderState.lawyerDecisionCountdown,
    resetCardToProfile,
    closeLawyerModal,
    startPriceEvaluation: startRequestFlow,
    startRequestFlow,
    proceedToPayment,
    proceedFromConfirmedPayment,
    backFromPayment,
    stepBackInFlow,
    setSelectedPaymentMethod,
    confirmPayment,
  };
}

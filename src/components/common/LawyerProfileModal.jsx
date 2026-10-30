import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  EvaluatingPriceStage,
  PriceReadyStage,
  WaitingAcceptanceStage,
  LawyerDecisionStage,
  LawyerProfileDetails,
} from './LawyerOrderStages';
import './LawyerProfileModal.css';

export default function LawyerProfileModal({
  lawyer,
  cardStage = 'PROFILE', // 'PROFILE' | 'WAITING_ACCEPTANCE' | 'LAWYER_DECISION' | 'EVALUATING_PRICE' | 'PRICE_READY'
  evaluatedPrice = 350,
  lawyerDecisionStatus = null, // 'ACCEPTED' | 'REJECTED' | null
  lawyerDecisionCountdown = 3,
  hasAlternativeLawyer = true,
  readOnly = false,
  onClose,
  onStepBack,
  onStartPriceEvaluation,
  onRequestService,
  onSelectAlternativeLawyer,
  onProceedToPayment,
}) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    startYRef.current = null;
  }, [cardStage, lawyer?.id]);

  if (!lawyer) return null;

  const isInnerStage = cardStage !== 'PROFILE';

  const handleBackClick = () => {
    if (isInnerStage && onStepBack) {
      onStepBack(lawyer);
    } else {
      onClose?.();
    }
  };

  const handleTouchStart = (e) => {
    if (isInnerStage) return;
    const scrollEl = scrollContainerRef.current;
    if (
      scrollEl &&
      scrollEl.scrollTop > 4 &&
      !e.currentTarget.classList.contains('lawyer-modal-drag-zone')
    ) {
      return;
    }
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (isInnerStage || !isDragging || startYRef.current === null) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (isInnerStage) {
      setIsDragging(false);
      startYRef.current = null;
      setDragY(0);
      return;
    }
    if (!isDragging) return;
    setIsDragging(false);
    startYRef.current = null;
    if (dragY > 65) {
      setDragY(0);
      onClose?.();
    } else {
      setDragY(0);
    }
  };

  return (
    <div className="lawyer-modal-backdrop">
      <div
        className={`lawyer-modal-sheet ${!isInnerStage && isDragging ? 'is-dragging' : ''}`}
        style={{
          transform: !isInnerStage && dragY > 0 ? `translateY(${dragY}px)` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Drag Indicator & Unified Back / Close Navigation Header */}
        <div
          className="lawyer-modal-header lawyer-modal-drag-zone"
          onTouchStart={handleTouchStart}
          onMouseDown={handleTouchStart}
        >
          <button
            type="button"
            className="lawyer-modal-back"
            onClick={handleBackClick}
            aria-label="رجوع"
          >
            <ChevronRight size={19} />
          </button>

          <div className="sheet-pill-handle"></div>

          <button
            type="button"
            className="lawyer-modal-close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={19} />
          </button>
        </div>

        {/* Scrollable Content without visible scrollbar */}
        <div className="lawyer-modal-scroll-content" ref={scrollContainerRef}>
          {cardStage === 'EVALUATING_PRICE' && (
            <EvaluatingPriceStage lawyer={lawyer} />
          )}

          {cardStage === 'PRICE_READY' && (
            <PriceReadyStage
              lawyer={lawyer}
              evaluatedPrice={evaluatedPrice}
            />
          )}

          {cardStage === 'WAITING_ACCEPTANCE' && (
            <WaitingAcceptanceStage lawyer={lawyer} />
          )}

          {cardStage === 'LAWYER_DECISION' && (
            <LawyerDecisionStage
              lawyer={lawyer}
              lawyerDecisionStatus={lawyerDecisionStatus}
              lawyerDecisionCountdown={lawyerDecisionCountdown}
            />
          )}

          {cardStage === 'PROFILE' && (
            <LawyerProfileDetails lawyer={lawyer} />
          )}
        </div>

        {/* Actions Footer */}
        {cardStage === 'PROFILE' && (
          <div className="lawyer-modal-footer">
            {readOnly ? (
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
                className="w-full h-12 text-base font-bold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-[7px] shadow-sm flex items-center justify-center"
              >
                <span>إغلاق الملف</span>
              </Button>
            ) : (
              <>
                <div className="lawyer-modal-actions-row">
                  <Button
                    type="button"
                    onClick={() =>
                      onStartPriceEvaluation
                        ? onStartPriceEvaluation(lawyer)
                        : onRequestService?.(lawyer)
                    }
                    className="lawyer-primary-order-btn text-base font-bold"
                  >
                    <span>طلب الآن</span>
                  </Button>

                  {onSelectAlternativeLawyer && (
                    <Button
                      type="button"
                      disabled={!hasAlternativeLawyer}
                      onClick={() => onSelectAlternativeLawyer(lawyer)}
                      className="lawyer-alt-btn font-bold"
                    >
                      <span>محامي اخر</span>
                    </Button>
                  )}
                </div>
                {onSelectAlternativeLawyer && !hasAlternativeLawyer && (
                  <p className="lawyer-no-alt-note">
                    لا يوجد محامون بديلون آخرون في نطاق موقعك حالياً
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {cardStage === 'PRICE_READY' && (
          <div className="lawyer-modal-footer">
            <Button
              type="button"
              onClick={() => onProceedToPayment?.(lawyer)}
              className="w-full text-base"
            >
              <span>دفع الآن ({evaluatedPrice} ج.م)</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { Suspense } from 'react';
import ScreenErrorBoundary from './ScreenErrorBoundary';

/**
 * غلاف موحد وآمن للشاشات يحتوي على Suspense و Error Boundary
 */
export default function ScreenWrapper({ onReset, children, fallback = null }) {
  return (
    <Suspense fallback={fallback}>
      <ScreenErrorBoundary onReset={onReset}>
        {children}
      </ScreenErrorBoundary>
    </Suspense>
  );
}


import { useContext } from 'react';
import { RouterContext } from './context.js';

/**
 * هوك استخدام نظام التوجيه في أي مكون
 */
export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}


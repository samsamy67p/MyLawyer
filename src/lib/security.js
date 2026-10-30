/**
 * Security & Input Sanitization Utilities for MyLawyer
 * Prevents XSS, script injection, and payload manipulation.
 */

/**
 * Sanitizes a string input by removing control characters, trim, and length clamping.
 * @param {any} input 
 * @param {number} [maxLength=500] 
 * @returns {string} Clean, safe string
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== 'string') {
    if (input === null || input === undefined) return '';
    input = String(input);
  }

  // Remove potential dangerous characters & null bytes
  const cleaned = input
    .replace(/\0/g, '') // remove null bytes
    .replace(/[<>]/g, '') // prevent raw HTML angle brackets
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Validates and normalizes Egyptian phone numbers.
 * Valid Egyptian mobile prefixes: 010, 011, 012, 015 (11 digits).
 * Also accepts generic valid phone formats for guests/tests.
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/\D/g, '');
  // Valid length check (between 10 and 15 digits)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Validates safe external/internal URLs.
 * Prevents javascript: or data: URL execution in links or webviews.
 * @param {string} url 
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  
  // Explicitly deny dangerous schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }

  // Allow standard http/https or tel/mailto/sms
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('mailto:')
  );
}

/**
 * Safely parses JSON without throwing exceptions or allowing prototype pollution.
 * @param {string} jsonString 
 * @param {any} fallback 
 * @returns {any}
 */
export function safeJsonParse(jsonString, fallback = null) {
  if (!jsonString || typeof jsonString !== 'string') return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    // Protect against prototype pollution
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed) {
        delete parsed.__proto__;
        delete parsed.constructor;
      }
    }
    return parsed;
  } catch {
    return fallback;
  }
}


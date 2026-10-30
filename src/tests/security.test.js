import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeText,
  isValidPhoneNumber,
  isSafeUrl,
  safeJsonParse,
} from '../lib/security.js';

describe('8. Application Security & Input Sanitization Suite', () => {
  it('sanitizes malicious script tags and angle brackets from text inputs', () => {
    const malicious = '<script>alert("xss")</script>أحتاج محامي في قسم الدقي';
    const clean = sanitizeText(malicious);
    assert.equal(clean.includes('<'), false);
    assert.equal(clean.includes('>'), false);
    assert.equal(clean.includes('أحتاج محامي في قسم الدقي'), true);
  });

  it('clamps excessive input lengths to prevent buffer / payload exhaustion', () => {
    const hugeInput = 'A'.repeat(1000);
    const clamped = sanitizeText(hugeInput, 150);
    assert.equal(clamped.length, 150);
  });

  it('validates legitimate phone numbers and blocks malformed numbers', () => {
    assert.equal(isValidPhoneNumber('01012345678'), true);
    assert.equal(isValidPhoneNumber('+201123456789'), true);
    assert.equal(isValidPhoneNumber('012-345-6789'), true);

    // Invalid phones
    assert.equal(isValidPhoneNumber('123'), false);
    assert.equal(isValidPhoneNumber(''), false);
    assert.equal(isValidPhoneNumber(null), false);
    assert.equal(isValidPhoneNumber('not-a-number'), false);
  });

  it('identifies and blocks dangerous URL protocols (javascript, data, vbscript)', () => {
    // Dangerous
    assert.equal(isSafeUrl('javascript:alert(1)'), false);
    assert.equal(isSafeUrl('JAVASCRIPT:void(0)'), false);
    assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
    assert.equal(isSafeUrl('file:///etc/passwd'), false);
    assert.equal(isSafeUrl(null), false);
    assert.equal(isSafeUrl(''), false);

    // Safe
    assert.equal(isSafeUrl('https://maps.google.com/place/Karim+El+Deeb'), true);
    assert.equal(isSafeUrl('http://localhost:5173'), true);
    assert.equal(isSafeUrl('tel:01012345678'), true);
  });

  it('safely parses JSON without throwing errors or permitting prototype pollution', () => {
    const validJson = JSON.stringify({ name: 'كريم', phone: '01012345678' });
    const parsed = safeJsonParse(validJson);
    assert.equal(parsed.name, 'كريم');
    assert.equal(parsed.phone, '01012345678');

    // Invalid JSON fallback
    assert.equal(safeJsonParse('{bad-json}', 'FALLBACK'), 'FALLBACK');
    assert.equal(safeJsonParse(null, null), null);

    // Prototype pollution prevention
    const maliciousPayload = '{"__proto__": {"polluted": true}, "name": "safe"}';
    const sanitizedObj = safeJsonParse(maliciousPayload);
    assert.equal(sanitizedObj.name, 'safe');
    assert.equal(Object.prototype.polluted, undefined);
  });
});


import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROUTES,
  VALID_ROUTES,
  normalizePath,
  isValidRoute,
} from '../router/routes.js';

describe('7. In-App Routing Architecture & Navigation Validation', () => {
  it('defines all required canonical routes with distinct internal paths', () => {
    assert.equal(ROUTES.LOGIN, '/login');
    assert.equal(ROUTES.LOCATION_SETUP, '/location/setup');
    assert.equal(ROUTES.LOCATION_MAP, '/location/map');
    assert.equal(ROUTES.HOME, '/');
    assert.equal(ROUTES.ORDERS, '/orders');
    assert.equal(ROUTES.WALLET, '/wallet');
    assert.equal(ROUTES.ACCOUNT, '/account');
    assert.equal(ROUTES.LAWYER_NOW_REQUEST, '/lawyer-now/request');
    assert.equal(ROUTES.LAWYER_NOW_MAP, '/lawyer-now/map');
  });

  it('normalizes routes safely (strips queries, hashes, extra slashes)', () => {
    assert.equal(normalizePath('/orders?tab=active'), '/orders');
    assert.equal(normalizePath('/wallet#transactions'), '/wallet');
    assert.equal(normalizePath('account'), '/account');
    assert.equal(normalizePath(''), '/');
    assert.equal(normalizePath(null), '/');
    assert.equal(normalizePath(undefined), '/');
    assert.equal(normalizePath('  /LAWYER-NOW/MAP  '), '/lawyer-now/map');
  });

  it('validates canonical routes and safely rejects non-existent paths', () => {
    assert.equal(isValidRoute('/'), true);
    assert.equal(isValidRoute('/orders'), true);
    assert.equal(isValidRoute('/wallet'), true);
    assert.equal(isValidRoute('/account'), true);
    assert.equal(isValidRoute('/lawyer-now/request'), true);
    assert.equal(isValidRoute('/lawyer-now/map'), true);
    assert.equal(isValidRoute('/location/setup'), true);
    assert.equal(isValidRoute('/login'), true);

    // Invalid or unknown paths
    assert.equal(isValidRoute('/unknown-page'), false);
    assert.equal(isValidRoute('/admin/dashboard'), false);
    assert.equal(isValidRoute('/service/fake'), false);
  });

  it('preserves route integrity without duplicate canonical path registrations', () => {
    const routeValues = Object.values(ROUTES);
    const uniqueValues = new Set(routeValues);
    assert.equal(routeValues.length, uniqueValues.size);
    assert.equal(VALID_ROUTES.length, routeValues.length);
  });
});


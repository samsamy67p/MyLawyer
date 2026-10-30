import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getButtonLoadingState } from '../lib/buttonLoading.js';

describe('10. Button Unified Loading & Spinner Architecture Validation', () => {
  it('correctly configures normal state when isLoading is false or undefined', () => {
    const state = getButtonLoadingState({ isLoading: false, disabled: false });
    assert.equal(state.isBusy, false);
    assert.equal(state.isDisabled, false);
    assert.equal(state.contentClass, '');
  });

  it('correctly hides content and sets busy/disabled flags when isLoading is true', () => {
    const state = getButtonLoadingState({ isLoading: true, disabled: false });
    assert.equal(state.isBusy, true);
    assert.equal(state.isDisabled, true);
    assert.ok(state.contentClass.includes('invisible'));
    assert.ok(state.contentClass.includes('opacity-0'));
    assert.ok(state.contentClass.includes('select-none'));
    assert.ok(state.contentClass.includes('pointer-events-none'));
  });

  it('preserves disabled state if button was already disabled regardless of isLoading', () => {
    const state = getButtonLoadingState({ isLoading: false, disabled: true });
    assert.equal(state.isBusy, false);
    assert.equal(state.isDisabled, true);
    assert.equal(state.contentClass, '');
  });

  it('selects appropriate spinner dimensions according to button size prop', () => {
    const smState = getButtonLoadingState({ isLoading: true, size: 'sm' });
    assert.equal(smState.spinnerClass, 'w-3.5 h-3.5');

    const defaultState = getButtonLoadingState({ isLoading: true, size: 'default' });
    assert.equal(defaultState.spinnerClass, 'w-5 h-5');

    const lgState = getButtonLoadingState({ isLoading: true, size: 'lg' });
    assert.equal(lgState.spinnerClass, 'w-5 h-5');
  });

  it('selects high-contrast spinner border styling for primary vs secondary/outline variants', () => {
    const defaultState = getButtonLoadingState({ isLoading: true, variant: 'default' });
    assert.ok(defaultState.spinnerBorderClass.includes('border-white'));

    const outlineState = getButtonLoadingState({ isLoading: true, variant: 'outline' });
    assert.ok(outlineState.spinnerBorderClass.includes('border-[#1D4ED8]'));

    const secondaryState = getButtonLoadingState({ isLoading: true, variant: 'secondary' });
    assert.ok(secondaryState.spinnerBorderClass.includes('border-[#1D4ED8]'));
  });
});

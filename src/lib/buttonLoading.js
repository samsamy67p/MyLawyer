/**
 * Helper to determine unified button loading states and classes
 * Ensures zero-jitter layout stability and unified spinner appearance
 */
export function getButtonLoadingState({ isLoading, disabled, size = 'default', variant = 'default' }) {
  const isBusy = Boolean(isLoading);
  const isDisabled = isBusy || Boolean(disabled);

  const spinnerClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  const spinnerBorderClass =
    variant === 'default' || variant === 'primary' || !variant
      ? 'border-white/30 border-t-white'
      : 'border-[#1D4ED8]/25 border-t-[#1D4ED8]';

  const contentClass = isBusy
    ? 'invisible opacity-0 select-none pointer-events-none'
    : '';

  return {
    isBusy,
    isDisabled,
    spinnerClass,
    spinnerBorderClass,
    contentClass,
  };
}


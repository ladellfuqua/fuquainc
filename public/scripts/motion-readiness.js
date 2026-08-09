(() => {
  const motionPreference = window.matchMedia(
    '(prefers-reduced-motion: no-preference)'
  );

  const syncMotionReadiness = () => {
    const enabled =
      motionPreference.matches && 'IntersectionObserver' in window;

    if (enabled) {
      document.documentElement.dataset.motion = 'enabled';
    } else {
      document.documentElement.removeAttribute('data-motion');
    }
  };

  syncMotionReadiness();
  motionPreference.addEventListener?.('change', syncMotionReadiness);
})();

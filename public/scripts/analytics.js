(() => {
  if (
    location.hostname !== 'fuquainc.com' &&
    location.hostname !== 'www.fuquainc.com'
  ) {
    return;
  }

  const currentScript = document.currentScript;
  const measurementId = currentScript?.dataset.gaId;
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // Traffic measurement only, matching the site's published privacy policy.
  // Do not enable Google Signals or advertising personalization beacons.
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
})();

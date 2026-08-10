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
  window.gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
})();

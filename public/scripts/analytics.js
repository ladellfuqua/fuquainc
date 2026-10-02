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

  let allowed = false;
  let scheduled = false;
  let started = false;
  const disableKey = `ga-disable-${measurementId}`;
  window[disableKey] = true;

  // Remove only this site's analytics cookies, including cookies from visits
  // before the consent banner was introduced. Never touch login/session cookies.
  const clearAnalyticsCookies = () => {
    const names = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
    for (const name of names.filter(name => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name))) {
      for (const domain of ['', location.hostname, 'fuquainc.com']) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ''}`;
      }
    }
  };

  const loadAnalytics = () => {
    scheduled = false;
    // Consent can be withdrawn while waiting for page load or idle time.
    if (!allowed || started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 60 * 60 * 24 * 180,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };

  // No Google requests or page-view queue until analytics is explicitly allowed.
  const scheduleAnalytics = () => {
    if (!allowed || scheduled || started) return;
    scheduled = true;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadAnalytics, { timeout: 2000 });
    } else {
      window.setTimeout(loadAnalytics, 0);
    }
  };

  const applyConsent = (accepted) => {
    allowed = accepted === true;
    window[disableKey] = !allowed;
    if (!allowed) {
      // Wait for the consent library to read the saved preference before
      // clearing cookies, so returning accepted visitors keep their identity.
      if (accepted === false) clearAnalyticsCookies();
      // Unload Google's existing event listeners after withdrawal. The consent
      // library has already saved the new choice before dispatching this event.
      if (started) location.reload();
    } else if (document.readyState === 'complete') {
      scheduleAnalytics();
    }
  };

  window.addEventListener('fuqua:analytics-consent', (event) => applyConsent(event.detail));
  if (document.readyState !== 'complete') {
    window.addEventListener('load', scheduleAnalytics, { once: true });
  }
  // Covers either execution order of the deferred loader and consent module.
  applyConsent(window.fuquaAnalyticsAllowed);
})();

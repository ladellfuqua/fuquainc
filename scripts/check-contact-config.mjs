// Vercel injects these private settings into the build and function runtime.
// Stop production builds before publishing a form that cannot deliver mail.
// Local/CI and preview builds remain usable without production credentials.
if (process.env.VERCEL_ENV === 'production') {
  const missing = ['RESEND_API_KEY', 'CONTACT_TO_EMAIL'].filter(
    (name) => !process.env[name]?.trim()
  );
  if (missing.length) {
    console.error(`Contact delivery is not configured: missing ${missing.join(', ')}.`);
    console.error('Set these in the Vercel Production environment and redeploy. Never put their values in source control.');
    process.exitCode = 1;
  }
}

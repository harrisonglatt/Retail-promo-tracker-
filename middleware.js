// Vercel Edge Middleware — HTTP Basic Auth for the entire site.
// Protects the dashboard HTML, the sales CSV, the promo XLSX, and any other asset.
// Set SITE_USER + SITE_PASSWORD in Vercel → Project → Settings → Environment Variables.
// If SITE_PASSWORD is not set, every request returns 401 (fail closed) so the data
// is never accidentally exposed before configuration.

export const config = {
  matcher: ['/((?!_vercel/|favicon.ico).*)'],
};

export default function middleware(request) {
  const expectedUser = process.env.SITE_USER || 'admin';
  const expectedPass = process.env.SITE_PASSWORD || '';

  const unauthorized = (msg) => new Response(msg || 'Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Retail Promo Tracker"',
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  });

  if (!expectedPass) {
    return unauthorized('SITE_PASSWORD env var is not configured. Set it in Vercel project settings.');
  }

  const auth = request.headers.get('authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let user, pass;
  try {
    const decoded = atob(encoded);
    const idx = decoded.indexOf(':');
    user = decoded.slice(0, idx);
    pass = decoded.slice(idx + 1);
  } catch {
    return unauthorized('Malformed credentials');
  }

  if (user !== expectedUser || pass !== expectedPass) {
    return unauthorized('Wrong credentials');
  }

  // Authenticated — let the request through to the static asset
  return;
}

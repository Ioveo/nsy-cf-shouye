export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // If requesting root /studio/ or a static file with extension, pass through to static assets
  if (url.pathname === "/studio" || url.pathname === "/studio/" || /\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return next();
  }

  // Otherwise SPA subroutes (e.g. /studio/sign-in, /studio/software):
  // Fetch /studio/ to avoid Cloudflare Pages 308 pretty URL redirect loop
  return env.ASSETS.fetch(new URL("/studio/", request.url));
}

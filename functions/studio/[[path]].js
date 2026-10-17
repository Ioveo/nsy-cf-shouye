export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  // If requesting a static asset with file extension (e.g. .js, .css, .svg, .png), fetch as-is
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return env.ASSETS.fetch(request);
  }
  // Otherwise, serve /studio/index.html (SPA fallback)
  const indexUrl = new URL("/studio/index.html", request.url);
  return env.ASSETS.fetch(new Request(indexUrl, request));
}

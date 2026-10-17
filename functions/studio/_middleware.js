export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // If requesting a static asset with file extension (.js, .css, .png, .svg, etc.), fetch directly from ASSETS
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return env.ASSETS.fetch(request);
  }

  // For /studio, /studio/, or any SPA subroute (/studio/sign-in, /studio/software, etc.),
  // serve /studio/index.html directly from ASSETS
  return env.ASSETS.fetch(new URL("/studio/index.html", request.url));
}



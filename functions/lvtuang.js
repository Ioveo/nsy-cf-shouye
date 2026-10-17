export async function onRequestGet({ request }) {
  return Response.redirect(new URL("/studio/", request.url), 302);
}

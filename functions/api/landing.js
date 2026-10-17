import { loadLanding } from "../_landing/store.js";

export async function onRequestGet({ env }) {
  const landing = await loadLanding(env);
  return new Response(JSON.stringify({
    homeLanding: landing.homeLanding,
    content: landing.content
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}

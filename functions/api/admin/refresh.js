import { refreshAdmin } from "./_lib.js";

export async function onRequestPost({ request, env }) {
  return refreshAdmin(request, env);
}

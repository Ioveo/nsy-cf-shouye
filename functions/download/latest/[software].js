import { findLatestRelease, isDownloadableRelease, loadCatalog } from "../../_lib/catalog.js";
import { incrementReleaseDownload } from "../../_lib/download-stats.js";
import { serveRelease, shouldCountDownload, text } from "../../_lib/releases.js";

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const catalog = await loadCatalog(env);
  const match = findLatestRelease(catalog, params.software);
  const release = match?.release;
  if (!release || !(release.fileKey || release.publicUrl) || !isDownloadableRelease(release)) return text("Release not found", 404);

  if (shouldCountDownload(request)) {
    const task = incrementReleaseDownload(env, release.id).catch(error => console.warn("download stats failed:", error));
    if (typeof context.waitUntil === "function") context.waitUntil(task);
  }

  if (release.publicUrl && (release.storageId !== "default" || !release.fileKey)) {
    return Response.redirect(release.publicUrl, 302);
  }
  return serveRelease(env, {
    key: release.fileKey,
    fileName: release.fileName,
    size: release.size,
    sha256: release.sha256
  }, request);
}

export const onRequestHead = onRequestGet;

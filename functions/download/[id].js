import { findLatestRelease, loadManifest, serveRelease, shouldCountDownload, text } from "../_lib/releases.js";
import { findLatestRelease as findLatestCatalogRelease, findRelease, isDownloadableRelease, loadCatalog } from "../_lib/catalog.js";
import { incrementReleaseDownload } from "../_lib/download-stats.js";

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const catalog = await loadCatalog(env);
  const releaseId = params.id;

  const catalogMatch = releaseId === "latest"
    ? findLatestCatalogRelease(catalog, "datacenter") || findLatestCatalogRelease(catalog, catalog.software?.[0]?.slug)
    : findRelease(catalog, releaseId);
  if (catalogMatch?.release && !isDownloadableRelease(catalogMatch.release)) {
    return text("Release file has not been uploaded yet", 404);
  }

  if (catalogMatch?.release && (catalogMatch.release.fileKey || catalogMatch.release.publicUrl)) {
    const release = catalogMatch.release;
    countDownload(context, release.id);
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

  const manifest = await loadManifest(env);
  const release = releaseId === "latest"
    ? findLatestRelease(manifest)
    : manifest.releases?.find(item => item.id === releaseId);

  if (!release) {
    return text("Release not found", 404);
  }

  return serveRelease(env, release, request);
}

export const onRequestHead = onRequestGet;

// 下载计数不阻塞下载，D1 异常也不影响文件返回
function countDownload(context, releaseId) {
  if (!shouldCountDownload(context.request)) return;
  const task = incrementReleaseDownload(context.env, releaseId).catch(error => console.warn("download stats failed:", error));
  if (typeof context.waitUntil === "function") context.waitUntil(task);
}

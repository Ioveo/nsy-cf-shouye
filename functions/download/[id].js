import { findLatestRelease, loadManifest, serveRelease, shouldCountDownload, text } from "../_lib/releases.js";
import { findLatestRelease as findLatestCatalogRelease, findRelease, isDownloadableRelease, loadCatalog } from "../_lib/catalog.js";
import { incrementReleaseDownload } from "../_lib/download-stats.js";

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const catalog = await loadCatalog(env);
  const releaseId = params.id;
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");

  let catalogMatch = releaseId === "latest"
    ? findLatestCatalogRelease(catalog, "datacenter") || findLatestCatalogRelease(catalog, catalog.software?.[0]?.slug)
    : findRelease(catalog, releaseId);

  // 双重身份兼容兜底：如果按 releaseId 未命中，自动降级按软件 id 或 slug 查找（兼容直接访问 /download/yi-xia）
  if (!catalogMatch?.release && releaseId !== "latest") {
    const sw = (catalog.software || []).find(s => s.id === releaseId || s.slug === releaseId);
    if (sw) {
      const pubReleases = (sw.releases || []).filter(isDownloadableRelease);
      let matchRelease = null;
      if (platform) {
        matchRelease = pubReleases.find(r => r.isLatest && r.platform === platform)
          || pubReleases.find(r => r.platform === platform);
      }
      if (!matchRelease) {
        matchRelease = pubReleases.find(r => r.isLatest) || pubReleases[0] || null;
      }
      if (matchRelease) {
        catalogMatch = { software: sw, release: matchRelease };
      }
    }
  }

  if (catalogMatch?.release && !isDownloadableRelease(catalogMatch.release)) {
    return text("Release file has not been uploaded yet", 404);
  }

  if (catalogMatch?.release && (catalogMatch.release.fileKey || catalogMatch.release.publicUrl)) {
    const release = catalogMatch.release;
    countDownload(context, release.id);
    if (release.publicUrl && (release.storageId !== "default" || !release.fileKey)) {
      return Response.redirect(release.publicUrl, 302);
    }
    const dlFileName = friendlyDownloadName(catalogMatch.software, release);
    return serveRelease(env, {
      key: release.fileKey,
      fileName: dlFileName,
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

function friendlyDownloadName(software, release) {
  if (!release) return "";
  const ext = (release.fileName || release.fileKey || "").split(".").pop() || "";
  const cleanExt = ext ? `.${ext.replace(/[^a-zA-Z0-9]/g, "")}` : "";
  if (!software?.name || !release.version) {
    return release.fileName || release.fileKey?.split("/").pop() || "download.bin";
  }
  const platLabels = {
    portable: "绿色便携版",
    windows: "Windows版",
    macos: "macOS版",
    linux: "Linux版",
    android: "Android版",
    other: "安装包"
  };
  const platLabel = platLabels[release.platform] || release.label || "安装包";
  const safeTitle = software.name.trim().replace(/[/\\?%*:|"<>]/g, "");
  return `${safeTitle}_v${release.version}_${platLabel}${cleanExt}`;
}

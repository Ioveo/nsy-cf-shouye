import { findLatestRelease, isDownloadableRelease, loadCatalog } from "../../_lib/catalog.js";
import { incrementReleaseDownload } from "../../_lib/download-stats.js";
import { serveRelease, shouldCountDownload, text } from "../../_lib/releases.js";

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const catalog = await loadCatalog(env);
  const match = findLatestRelease(catalog, params.software);
  let release = match?.release;

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform");
  if (match?.software && platform) {
    const pubReleases = (match.software.releases || []).filter(isDownloadableRelease);
    const platRelease = pubReleases.find(r => r.isLatest && r.platform === platform)
      || pubReleases.find(r => r.platform === platform);
    if (platRelease) {
      release = platRelease;
    }
  }

  if (!release || !(release.fileKey || release.publicUrl) || !isDownloadableRelease(release)) return text("Release not found", 404);

  if (shouldCountDownload(request)) {
    const task = incrementReleaseDownload(env, release.id).catch(error => console.warn("download stats failed:", error));
    if (typeof context.waitUntil === "function") context.waitUntil(task);
  }

  if (release.publicUrl && (release.storageId !== "default" || !release.fileKey)) {
    return Response.redirect(release.publicUrl, 302);
  }

  const dlFileName = friendlyDownloadName(match?.software, release);
  return serveRelease(env, {
    key: release.fileKey,
    fileName: dlFileName,
    size: release.size,
    sha256: release.sha256
  }, request);
}

export const onRequestHead = onRequestGet;

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

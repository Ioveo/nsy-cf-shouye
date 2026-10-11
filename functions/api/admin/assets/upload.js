import { saveAsset } from "../../../_lib/assets-db.js";
import { ASSET_LIMITS, inferredContentType, keyFor, normalizeKind, sanitizeFileName, withAssetUrl } from "../../../_lib/asset-upload.js";
import { decryptSecret } from "../../../_lib/crypto.js";
import { loadCatalog } from "../../../_lib/catalog.js";
import { publicUrlFor, putExternalR2 } from "../../../_lib/r2-s3.js";
import { json } from "../../../_lib/releases.js";
import { requireAdmin } from "../_lib.js";

const LIMITS = ASSET_LIMITS;

export async function onRequestPost({ request, env }) {
  if (String(request.headers.get("Content-Type") || "").includes("application/json")) {
    return uploadJsonAsset(request, env);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, msg: "读取上传文件失败" }, 400);
  }

  const auth = await requireAdmin(request, env, formData);
  if (!auth.ok) return auth.response;

  const file = formData.get("file");
  if (!file?.arrayBuffer) return json({ success: false, msg: "请选择文件" }, 400);
  const input = {
    storageId: String(formData.get("storageId") || "default"),
    kind: String(formData.get("kind") || "other"),
    folder: String(formData.get("folder") || ""),
    refType: String(formData.get("refType") || ""),
    refId: String(formData.get("refId") || ""),
    source: "manual-upload",
    fileName: file.name || "asset.bin",
    contentType: file.type || "",
    bytes: await file.arrayBuffer()
  };
  return saveUploadedAsset(env, input);
}

async function uploadJsonAsset(request, env) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;
  const body = auth.body || {};
  if (!body.data) return json({ success: false, msg: "上传数据为空" }, 400);
  return saveUploadedAsset(env, {
    storageId: String(body.storageId || "default"),
    kind: String(body.kind || "other"),
    folder: String(body.folder || ""),
    refType: String(body.refType || ""),
    refId: String(body.refId || ""),
    source: String(body.source || "manual-upload"),
    fileName: body.fileName || "asset.bin",
    contentType: body.contentType || "",
    bytes: base64ToBytes(String(body.data || ""))
  });
}

async function saveUploadedAsset(env, input) {
  const fileName = sanitizeFileName(input.fileName || "asset.bin");
  const contentType = String(input.contentType || inferredContentType(fileName) || "application/octet-stream");
  const kind = normalizeKind(input.kind, fileName, contentType);
  if (!kind) return json({ success: false, msg: "文件类型不支持" }, 400);

  const bytes = toArrayBuffer(input.bytes);
  if (bytes.byteLength > (LIMITS[kind] || LIMITS.other)) return json({ success: false, msg: "文件超过允许大小" }, 400);

  const storageId = String(input.storageId || "default");
  const key = keyFor(kind, String(input.folder || ""), fileName);
  const sha256 = await sha256Hex(bytes);
  let bucket = env.SOFTWARE_BUCKET_NAME || "";
  let publicUrl = "";

  if (storageId === "default") {
    if (!env.SOFTWARE_BUCKET?.put) return json({ success: false, msg: "R2 未配置" }, 500);
    await env.SOFTWARE_BUCKET.put(key, bytes, { httpMetadata: { contentType } });
  } else {
    const catalog = await loadCatalog(env);
    const storage = catalog.storageAccounts.find(item => item.id === storageId && item.status !== "disabled");
    if (!storage) return json({ success: false, msg: "存储授权不存在或已停用" }, 404);
    const secret = await decryptSecret(env, storage.encryptedSecretAccessKey);
    await putExternalR2(storage, secret, key, bytes, contentType);
    bucket = storage.bucket;
    publicUrl = publicUrlFor(storage, key);
  }

  const asset = await saveAsset(env, {
    storageId,
    bucket,
    key,
    kind,
    mimeType: contentType,
    fileName,
    fileSize: bytes.byteLength,
    sha256,
    publicUrl,
    source: input.source,
    refType: input.refType,
    refId: input.refId
  });
  if (!asset) return json({ success: false, msg: "D1 未配置，资源记录保存失败" }, 500);
  return json({ success: true, asset: withAssetUrl(asset) });
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function toArrayBuffer(value) {
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  return new Uint8Array(value || []).buffer;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

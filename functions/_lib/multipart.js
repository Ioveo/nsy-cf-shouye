import { loadCatalog } from "./catalog.js";
import { decryptSecret } from "./crypto.js";
import {
  abortExternalMultipart,
  completeExternalMultipart,
  createExternalMultipart,
  headExternalR2,
  publicUrlFor,
  uploadExternalPart
} from "./r2-s3.js";

// 分片上传统一入口：默认 R2 走 Workers 绑定，外部 R2 走 S3 Multipart API
export const MAX_MULTIPART_SIZE = 10 * 1024 * 1024 * 1024;
export const MAX_PART_COUNT = 10000;

export function formatLimit(bytes) {
  return bytes >= 1024 ** 3 ? `${Math.round(bytes / 1024 ** 3)}GB` : `${Math.round(bytes / 1024 ** 2)}MB`;
}

export async function resolveUploadTarget(env, storageId = "default", catalog = null) {
  const id = String(storageId || "default");
  if (id === "default") {
    if (!env.SOFTWARE_BUCKET?.createMultipartUpload) throw uploadError("R2 未配置或不支持分片上传", 500);
    return { storageId: "default", bucket: env.SOFTWARE_BUCKET, bucketName: env.SOFTWARE_BUCKET_NAME || "" };
  }
  const data = catalog || await loadCatalog(env);
  const account = (data.storageAccounts || []).find(item => item.id === id && item.status !== "disabled");
  if (!account) throw uploadError("存储授权不存在或已停用", 404);
  const secret = await decryptSecret(env, account.encryptedSecretAccessKey);
  return { storageId: id, account, secret, bucketName: account.bucket || "" };
}

export function hasStorage(catalog, storageId) {
  const id = String(storageId || "default");
  return id === "default" || (catalog.storageAccounts || []).some(item => item.id === id && item.status !== "disabled");
}

export async function createMultipart(target, key, contentType = "application/octet-stream") {
  if (target.bucket) {
    const upload = await target.bucket.createMultipartUpload(key, { httpMetadata: { contentType } });
    return upload.uploadId;
  }
  return createExternalMultipart(target.account, target.secret, key, contentType);
}

export async function uploadMultipartPart(target, key, uploadId, partNumber, request) {
  if (target.bucket) {
    const part = await target.bucket.resumeMultipartUpload(key, uploadId).uploadPart(partNumber, request.body);
    return part.etag;
  }
  return uploadExternalPart(target.account, target.secret, key, uploadId, partNumber, await knownLengthBody(request));
}

export async function completeMultipart(target, key, uploadId, parts) {
  if (target.bucket) {
    await target.bucket.resumeMultipartUpload(key, uploadId).complete(parts);
    const head = await target.bucket.head(key);
    if (!head) throw uploadError("上传的文件在 R2 中未找到", 500);
    return { size: head.size };
  }
  await completeExternalMultipart(target.account, target.secret, key, uploadId, parts);
  const head = await headExternalR2(target.account, target.secret, key);
  if (!head) throw uploadError("上传的文件在外部 R2 中未找到", 500);
  return { size: head.size };
}

export async function abortMultipart(target, key, uploadId) {
  if (target.bucket) {
    await target.bucket.resumeMultipartUpload(key, uploadId).abort();
    return;
  }
  await abortExternalMultipart(target.account, target.secret, key, uploadId);
}

export function publicUrlForTarget(target, key) {
  return target.account ? publicUrlFor(target.account, key) : "";
}

// 校验并按分片号排序（R2/S3 要求升序）
export function normalizeParts(parts) {
  if (!Array.isArray(parts) || !parts.length) throw uploadError("缺少分片信息", 400);
  const normalized = parts
    .map(part => ({ partNumber: Number(part?.partNumber), etag: String(part?.etag || "") }))
    .sort((left, right) => left.partNumber - right.partNumber);
  const invalid = normalized.some((part, index) => !Number.isInteger(part.partNumber) || part.partNumber !== index + 1 || !part.etag);
  if (invalid || normalized.length > MAX_PART_COUNT) throw uploadError("分片信息不完整，请重新上传", 400);
  return normalized;
}

export function uploadError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function safeDecode(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

// 外部 R2 需要明确的 Content-Length，不能用 chunked 传输
async function knownLengthBody(request) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 0 && request.body && typeof FixedLengthStream === "function") {
    const fixed = new FixedLengthStream(length);
    request.body.pipeTo(fixed.writable).catch(() => {});
    return fixed.readable;
  }
  return request.arrayBuffer();
}

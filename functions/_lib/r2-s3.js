const ENCODER = new TextEncoder();

export async function putExternalR2(account, secretAccessKey, key, body, contentType = "application/octet-stream") {
  const url = objectUrlFor(account, key);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body);
  const host = url.host;
  const region = account.region || "auto";
  const service = "s3";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${account.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    },
    body
  });

  if (!response.ok) {
    throw new Error(`External R2 upload failed: ${response.status} ${await response.text()}`);
  }

  return { url: url.toString(), key };
}

export async function listExternalR2(account, secretAccessKey, { prefix = "", limit = 100 } = {}) {
  const url = bucketUrlFor(account);
  const params = new URLSearchParams();
  params.set("list-type", "2");
  params.set("max-keys", String(Math.min(Math.max(Number(limit) || 100, 1), 1000)));
  if (prefix) params.set("prefix", prefix);
  url.search = params.toString();

  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "GET", null, "");
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`External R2 list failed: ${response.status} ${text}`);
  }
  return parseListBucketResult(text);
}

// ---------- 外部 R2 分片上传（S3 Multipart Upload API） ----------

export async function createExternalMultipart(account, secretAccessKey, key, contentType = "application/octet-stream") {
  const url = objectUrlFor(account, key);
  url.search = "uploads=";
  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "POST", null, contentType);
  const text = await response.text();
  if (!response.ok) throw new Error(`External R2 create multipart failed: ${response.status} ${text}`);
  const uploadId = decodeXml(xmlValue(text, "UploadId"));
  if (!uploadId) throw new Error("External R2 did not return UploadId");
  return uploadId;
}

// body 可以是已知长度的 ReadableStream 或 ArrayBuffer；使用 UNSIGNED-PAYLOAD，避免在 Worker 里对分片做 SHA-256
export async function uploadExternalPart(account, secretAccessKey, key, uploadId, partNumber, body) {
  const url = objectUrlFor(account, key);
  url.search = canonicalQueryString(new URLSearchParams({ partNumber: String(partNumber), uploadId }));
  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "PUT", body, "", { unsignedPayload: true });
  if (!response.ok) throw new Error(`External R2 upload part failed: ${response.status} ${await response.text()}`);
  const etag = response.headers.get("ETag") || "";
  if (!etag) throw new Error("External R2 did not return ETag");
  return etag;
}

export async function completeExternalMultipart(account, secretAccessKey, key, uploadId, parts) {
  const url = objectUrlFor(account, key);
  url.search = canonicalQueryString(new URLSearchParams({ uploadId }));
  const xml = `<CompleteMultipartUpload>${parts.map(part => `<Part><PartNumber>${Number(part.partNumber)}</PartNumber><ETag>${escapeXml(part.etag)}</ETag></Part>`).join("")}</CompleteMultipartUpload>`;
  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "POST", xml, "application/xml");
  const text = await response.text();
  if (!response.ok || /<Error>/.test(text)) throw new Error(`External R2 complete multipart failed: ${response.status} ${text}`);
  return true;
}

export async function abortExternalMultipart(account, secretAccessKey, key, uploadId) {
  const url = objectUrlFor(account, key);
  url.search = canonicalQueryString(new URLSearchParams({ uploadId }));
  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "DELETE", null, "");
  if (!response.ok && response.status !== 404) throw new Error(`External R2 abort multipart failed: ${response.status} ${await response.text()}`);
  return true;
}

export async function headExternalR2(account, secretAccessKey, key) {
  const url = objectUrlFor(account, key);
  const response = await signedExternalR2Fetch(account, secretAccessKey, url, "HEAD", null, "");
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`External R2 head failed: ${response.status}`);
  return { size: Number(response.headers.get("Content-Length") || 0), etag: response.headers.get("ETag") || "" };
}

export function publicUrlFor(account, key) {
  if (!account.publicBaseUrl) return "";
  return `${account.publicBaseUrl.replace(/\/+$/, "")}/${encodePath(key)}`;
}

function endpointFor(account) {
  if (account.endpoint) return account.endpoint.replace(/\/+$/, "");
  return `https://${account.accountId}.r2.cloudflarestorage.com`;
}

function objectUrlFor(account, key) {
  const url = bucketUrlFor(account);
  const pathParts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  pathParts.push(...String(key).split("/").filter(Boolean));
  url.pathname = `/${pathParts.map(encodeRfc3986).join("/")}`;
  url.search = "";
  return url;
}

function bucketUrlFor(account) {
  const url = new URL(endpointFor(account));
  const pathParts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (pathParts[pathParts.length - 1] !== account.bucket) {
    pathParts.push(account.bucket);
  }
  url.pathname = `/${pathParts.map(encodeRfc3986).join("/")}`;
  url.search = "";
  return url;
}

async function signedExternalR2Fetch(account, secretAccessKey, url, method, body, contentType = "application/octet-stream", options = {}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = options.unsignedPayload ? "UNSIGNED-PAYLOAD" : body ? await sha256Hex(body) : await sha256Hex("");
  const host = url.host;
  const region = account.region || "auto";
  const service = "s3";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQueryString(url.searchParams),
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${account.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const headers = {
    "Authorization": authorization,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["Content-Type"] = contentType;
  return fetch(url, { method, headers, body });
}

function encodePath(path) {
  return String(path).split("/").map(encodeURIComponent).join("/");
}

// SigV4 要求按 RFC 3986 编码，encodeURIComponent 不会编码 !'()*，
// 文件名含括号（如 "Setup (1).exe"）时会导致 SignatureDoesNotMatch
function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQueryString(searchParams) {
  return Array.from(searchParams.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join("&");
}

function parseListBucketResult(xml) {
  const contents = [...String(xml || "").matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)];
  return contents.map(match => {
    const block = match[1];
    const key = decodeXml(xmlValue(block, "Key"));
    const size = Number(xmlValue(block, "Size") || 0);
    const uploaded = decodeXml(xmlValue(block, "LastModified"));
    const etag = decodeXml(xmlValue(block, "ETag")).replace(/^"|"$/g, "");
    return { key, size, uploaded, etag };
  }).filter(item => item.key);
}

function xmlValue(block, tag) {
  return new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block)?.[1] || "";
}

function escapeXml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" })[char]);
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function sha256Hex(value) {
  const data = typeof value === "string" ? ENCODER.encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return hex(new Uint8Array(digest));
}

async function hmac(key, value) {
  return crypto.subtle.sign("HMAC", key, typeof value === "string" ? ENCODER.encode(value) : value);
}

async function hmacHex(key, value) {
  return hex(new Uint8Array(await hmac(key, value)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", typeof secret === "string" ? ENCODER.encode(secret) : secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function getSigningKey(secret, dateStamp, region, service) {
  const kDate = await hmac(await hmacKey(`AWS4${secret}`), dateStamp);
  const kRegion = await hmac(await hmacKey(kDate), region);
  const kService = await hmac(await hmacKey(kRegion), service);
  const kSigning = await hmac(await hmacKey(kService), "aws4_request");
  return hmacKey(kSigning);
}

function hex(bytes) {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

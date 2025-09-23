// services/api-client.js
const BASE_URL = "https://a1afu3eanb.execute-api.ap-northeast-1.amazonaws.com";

// 追加：UTF-8 → Base64URL にして ASCII 化（日本語・絵文字も安全）
function toBase64Url(str) {
  const utf8 = new TextEncoder().encode(str);
  let b64 = btoa(String.fromCharCode(...utf8));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE_URL}${path}`.replace(/([^:]\/)\/+/g, "$1");
}

async function http(path, { method = "GET", headers = {}, body, idempotencyKey } = {}) {
  const url = buildUrl(path);

  const sendBody = (method === "GET" || method === "HEAD")
    ? undefined
    : (body != null ? JSON.stringify(body) : undefined);

  // ★ ここで安全化
  const safeHeaders = {
    "Content-Type": "application/json",
    ...(idempotencyKey ? { "Idempotency-Key": toBase64Url(String(idempotencyKey)) } : {}),
    ...headers,
  };

  const init = {
    method,
    mode: "cors",
    credentials: "omit",
    headers: safeHeaders,
    body: sendBody,
    cache: "no-store",
    keepalive: false,
  };

  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      return text ? JSON.parse(text) : null;
    }
    return res.json();
  } catch (err) {
    console.error("[api] fetch failed", { url, init, err });
    throw new Error(`Network/CORS error while ${method} ${url}: ${err?.message || err}`);
  }
}

export const api = {
  get: (p, opt) => http(p, { ...opt, method: "GET" }),
  post: (p, body, opt) => http(p, { ...opt, method: "POST", body }),
  put: (p, body, opt) => http(p, { ...opt, method: "PUT", body }),
  del: (p, opt) => http(p, { ...opt, method: "DELETE" }),
};
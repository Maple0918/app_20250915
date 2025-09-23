import { api } from "./api-client.js";

/**
 * 清算一覧（ページング）
 * 返り値はバックエンドの仕様に従います（例: { items, nextCursor }）
 */
export async function listSettlements({ limit = 50, cursor } = {}) {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  if (cursor) q.set("cursor", cursor);
  return api.get(`/settlements?${q.toString()}`);
}

/**
 * 清算申請
 * applicant はサーバ側で認証情報から決定してもOK
 */
export async function requestSettlement(applicant) {
  return api.post(
    `/settlements/request`,
    { applicant },
    { idempotencyKey: `st-req-${Date.now()}` }
  );
}

/**
 * 清算承認
 */
export async function approveSettlement(id) {
  if (!id) throw new Error("id が未指定です");
  return api.post(`/settlements/${encodeURIComponent(id)}/approve`, {});
}

/**
 * 清算却下
 */
export async function rejectSettlement(id) {
  if (!id) throw new Error("id が未指定です");
  return api.post(`/settlements/${encodeURIComponent(id)}/reject`, {});
}
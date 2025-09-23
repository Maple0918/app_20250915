import { api } from "./api-client.js";

/**
 * サマリー（Aさん/Bさんの残高などの確定値）
 * @returns {Promise<Record<"Aさん"|"Bさん", number>>}
 */
export async function getSummary({ from, to } = {}) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  return api.get(`/ledger/summary?${q.toString()}`);
}

/**
 * 監査用：1件の支出/清算に紐づく仕訳行を取得
 * @param {string} refId - 紐づく元取引のID（支出IDや清算ID）
 */
export async function getEntries(refId) {
  if (!refId) throw new Error("refId が未指定です");
  return api.get(`/ledger/entries?refId=${encodeURIComponent(refId)}`);
}

/**
 * （UI用プレビュー）等分計算：端数は支払者側に寄せる
 * 保存時はサーバが再計算する前提
 */
export function previewSplit(total, payer) {
  const t = Math.max(0, Math.trunc(Number(total) || 0));
  const halfDown = Math.floor(t / 2); // 端数は支払者
  const payerPortion = t - halfDown;
  const otherPortion = halfDown;

  if (payer === "Aさん") {
    return { Aさん: payerPortion, Bさん: otherPortion };
  }
  return { Bさん: payerPortion, Aさん: otherPortion };
}
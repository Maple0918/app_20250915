// フロントは「入力→送信→結果表示」に専念。確定検証・仕訳はサーバ側で実施。
import { api } from "./api-client.js";

/**
 * 支出一覧（期間/支払者/カテゴリで絞込可、ページング対応）
 * 返り値はバックエンドの仕様に従います（例: { items, nextCursor }）
 */
export async function listExpenses({
  from,
  to,
  payer,
  category,
  includeDeleted = 0,
  limit = 50,
  cursor,
} = {}) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (payer) q.set("payer", payer);
  if (category) q.set("category", category);
  q.set("includeDeleted", includeDeleted);
  if (limit) q.set("limit", String(limit));
  if (cursor) q.set("cursor", cursor);
  return api.get(`/expenses?${q.toString()}`);
}

/**
 * 支出追加
 */
export async function addExpense({ payer, amount, date, category, memo }) {
  if (!payer || !amount || !date || !category) {
    throw new Error("入力が不足しています");
  }
  return api.post(
    `/expenses`,
    { payer, amount: Number(amount), date, category, memo },
    { idempotencyKey: `exp-${payer}-${date}-${amount}` }
  );
}

/**
 * 支出編集
 */
export async function editExpense(id, { amount, date, category, memo }) {
  if (!id) throw new Error("id が未指定です");
  return api.put(`/expenses/${encodeURIComponent(id)}`, {
    amount: Number(amount),
    date,
    category,
    memo,
  });
}

/**
 * 支出の論理削除
 */
export async function deleteExpense(id) {
  if (!id) throw new Error("id が未指定です");
  return api.del(`/expenses/${encodeURIComponent(id)}`);
}
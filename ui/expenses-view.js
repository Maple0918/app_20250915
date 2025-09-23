// ========================
// 支出一覧表示機能（UI層）
// ui/expenses-view.js
// 役割：支出データを一覧表として画面に表示する
// 機能：
// - 支出データの取得と表示
// - 表示内容の整形
// - エラーハンドリング
// ========================

// import { listExpenses } from "../services/expenses-service.js";
// import { listAllSettlements } from "../services/settlements-service.js";

import { listExpenses } from "../services/expenses-service.js";
import { listSettlements } from "../services/settlements-service.js";

const $ = (sel, root = document) => root.querySelector(sel);

// どこでも再利用OK（ファイル先頭あたりに置く）
function pageItems(res) {
  if (!res) return [];
  if (Array.isArray(res.items))   return res.items;
  if (Array.isArray(res.data))    return res.data;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res))         return res;      // APIが素で配列返す場合
  return [];                                        // ← これで必ず配列
}

function showState({ loading = false, error = false, empty = false }) {
  const elLoading = $(".js-expense-loading");
  const elError   = $(".js-expense-error");
  const elEmpty   = $(".js-expense-empty");

  if (elLoading) elLoading.hidden = !loading;
  if (elError)   elError.hidden   = !error;
  if (elEmpty)   elEmpty.hidden   = !empty;
}

async function fetchAllSettlements() {
  const all = [];
  let cursor;
  do {
    const res = await listSettlements({ limit: 200, cursor });
    const items = pageItems(res);
    if (items.length) all.push(...items);
    cursor = res?.nextCursor ?? res?.cursor ?? null;
  } while (cursor);
  return all;
}

async function fetchAllExpenses() {
  const all = [];
  let cursor;
  do {
    const res = await listExpenses({ includeDeleted: 1, limit: 200, cursor });
    const items = pageItems(res);
    if (items.length) all.push(...items);
    cursor = res?.nextCursor ?? res?.cursor ?? null;
  } while (cursor);
  return all;
}

export async function renderExpensesTable() {
  const tbody = $(".js-expense-list");
  if (!tbody) {
    console.warn("[expensesView] .js-expense-list が見つかりません");
    return;
  }

  tbody.innerHTML = "";
  showState({ loading: true, error: false, empty: false });

  try {
    const [items, settlements] = await Promise.all([
      fetchAllExpenses(),
      fetchAllSettlements(),
    ]);

    let lastApprovedAt = null;
    const approved = (settlements || []).filter((s) => s.status === "承認済み");
    if (approved.length > 0) {
      lastApprovedAt = approved
        .map((s) => new Date(s.date))
        .reduce((a, b) => (a > b ? a : b));
    }

    const visible = [];
    for (const exp of items || []) {
      if (exp.deleted) continue;
      const updatedAt = exp.lastUpdated ? new Date(exp.lastUpdated) : new Date(exp.date);
      if (lastApprovedAt && updatedAt <= lastApprovedAt) continue;
      visible.push(exp);
    }

    visible.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (visible.length === 0) {
      showState({ loading: false, error: false, empty: true });
      return;
    }

    const frag = document.createDocumentFragment();
    visible.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.className = "c-expense-table__row";

      const td = (text) => {
        const cell = document.createElement("td");
        cell.className = "c-expense-table__cell";
        cell.textContent = text;
        return cell;
      };

      const fmtJPY = (n) => new Intl.NumberFormat("ja-JP").format(Number(n || 0)) + "円";

      tr.appendChild(td(exp.category ?? "-"));
      tr.appendChild(td(fmtJPY(exp.amount)));
      tr.appendChild(td(exp.date ?? "-"));
      tr.appendChild(td(exp.payer ?? "-"));

      if (typeof window.__showExpenseDetail === "function") {
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => window.__showExpenseDetail(exp));
      }

      frag.appendChild(tr);
    });

    tbody.appendChild(frag);
    showState({ loading: false, error: false, empty: false });

  } catch (err) {
    console.warn(err);
    showState({ loading: false, error: true, empty: false });
  }
}
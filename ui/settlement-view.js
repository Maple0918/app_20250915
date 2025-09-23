// ========================
// 清算関連UI表示機能（清算の状態とデータを画面に表示）
// ui/settlement-view.js
// 役割：清算関連のデータを画面に表示する
// 機能：
// - 清算通知バナー：申請状況の通知表示
// - 清算履歴：過去の清算記録一覧
// - 清算サマリー：現在の差額状況表示
// - 清算アクション：申請・承認・棄却ボタンの状態制御
// ========================

// import { currentUser } from "../core/state.js";
// import { listAllSettlements, calcCurrentDiff } from "../services/settlements-service.js";

import { currentUser } from "../core/state.js";
import { listSettlements } from "../services/settlements-service.js";
import { getSummary } from "../services/ledger-service.js";

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const formatJPY = (n) =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" })
    .format(Number(n || 0))
    .replace("￥", "") + "円";

const decorateAB = (s = "") =>
  s.replaceAll("Aさん", "🟦Aさん").replaceAll("Bさん", "🟧Bさん");


// どこでも再利用OK（ファイル先頭あたりに置く）
function pageItems(res) {
  if (!res) return [];
  if (Array.isArray(res.items))   return res.items;
  if (Array.isArray(res.data))    return res.data;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res))         return res;      // APIが素で配列返す場合
  return [];                                        // ← これで必ず配列
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

async function calcCurrentDiff() {
  const s = await getSummary(); // { "Aさん": number, "Bさん": number }
  const a = Number(s?.["Aさん"] || 0);
  if (a === 0) return { directionText: "", amount: 0 };
  if (a > 0)   return { directionText: "Bさん → Aさん", amount: a };
  return { directionText: "Aさん → Bさん", amount: Math.abs(a) };
}


// サマリー（ホーム/清算画面の .js-clearance-info を一括更新）
export async function renderClearanceSummaryAll() {
  const targets = $$(".js-clearance-info");
  if (!targets.length) return;

  try {
    const { directionText, amount } = await calcCurrentDiff();
    const text = !amount || Number(amount) === 0
      ? "差額はありません"
      : `${decorateAB(directionText)} ${formatJPY(amount)}`;
    targets.forEach((el) => (el.textContent = text));
  } catch (err) {
    console.warn(err);
    targets.forEach((el) => (el.textContent = "サマリーの取得に失敗しました"));
  }
}

// 清算画面のボタン可視状態切替（ハンドラは controller 側）
export async function renderClearanceActions() {
  const applyBtn   = $(".js-clearance-apply");
  const cancelBtn  = $(".js-clearance-cancel");
  const approveBtn = $(".js-clearance-approve2");
  const rejectBtn  = $(".js-clearance-reject2");
  const stateText  = $(".js-clearance-state");
  if (!applyBtn || !cancelBtn || !approveBtn || !rejectBtn) return;

  applyBtn.hidden = true;
  cancelBtn.hidden = true;
  approveBtn.hidden = true;
  rejectBtn.hidden = true;
  if (stateText) stateText.textContent = "";

  try {
    const settlements = await fetchAllSettlements();
    const pending = settlements.find((s) => s.status === "申請中");

    if (!pending) {
      applyBtn.hidden = false;
      return;
    }

    const iAmApplicant = pending.applicant === currentUser;
    if (iAmApplicant) {
      cancelBtn.hidden = false;
      if (stateText) stateText.textContent = "清算を申請中です。相手の承認を待っています。";
    } else {
      approveBtn.hidden = false;
      rejectBtn.hidden  = false;
      if (stateText) stateText.textContent = "清算申請を受けています。承認または棄却してください。";
    }
  } catch (e) {
    console.warn(e);
    if (stateText) stateText.textContent = "状態の取得に失敗しました";
  }
}

// 清算履歴
export async function renderSettlementHistory() {
  const ul        = document.querySelector(".js-clearance-history");
  const emptyEl   = document.querySelector(".js-clearance-empty");
  const loadingEl = document.querySelector(".js-clearance-loading");
  const errorEl   = document.querySelector(".js-clearance-error");
  if (!ul) return;

  ul.innerHTML = "";
  if (emptyEl)   emptyEl.hidden   = true;
  if (errorEl)   errorEl.hidden   = true;
  if (loadingEl) loadingEl.hidden = false;

  try {
    const all = await fetchAllSettlements();
    if (loadingEl) loadingEl.hidden = true;

    const items = (all || [])
      .slice()
      .sort((a, b) => (new Date(b.date || 0)) - (new Date(a.date || 0)));

    if (!items.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((st) => {
      const li = document.createElement("li");
      li.className = "c-history-list__item";
      const when = st.date ? new Date(st.date).toLocaleString() : "-";
      li.textContent = `[${when}] ${st.applicant}が申請: ${st.directionText}に${formatJPY(st.amount)} (${st.status})`;
      frag.appendChild(li);
    });

    ul.appendChild(frag);
  } catch (err) {
    console.warn(err);
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl)   errorEl.hidden   = false;
  }
}
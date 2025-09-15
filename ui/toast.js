// ========================
// ui/toast.js - 通知メッセージ表示システム
// ========================
//
// このファイルの役割：
// ユーザーに一時的な通知メッセージを表示するトースト機能を提供します。
// 成功・警告・エラーなどの操作結果をユーザーに分かりやすく伝えます。
//
// 主な機能：
// 1. 画面上部中央に通知を表示
// 2. 成功（緑）・警告（黄）・エラー（赤）の3種類の表示スタイル
// 3. 一定時間後の自動非表示
// 4. クリックまたはEscキーで手動非表示
// 5. 同時表示は1件のみ（新しい通知が古いものを上書き）
// 6. アクセシビリティ対応（スクリーンリーダー対応）
//
// 使用例：
// import { toast } from './ui/toast.js';
// toast.success('保存しました');     // 成功メッセージ
// toast.error('エラーが発生しました'); // エラーメッセージ
// toast.warn('注意が必要です');       // 警告メッセージ
// ========================

let rootEl = null;
let timer = null;

function ensureRoot() {
  if (rootEl) return rootEl;

  const el = document.createElement("div");
  el.id = "js-toast";
  el.setAttribute("role", "status");
  Object.assign(el.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    maxWidth: "480px",
    padding: "10px 14px",
    borderRadius: "10px",
    boxShadow: "0 6px 18px rgba(0,0,0,.15)",
    color: "#fff",
    fontSize: "14px",
    zIndex: "10000",
    opacity: "0",
    transition: "opacity 180ms ease",
    userSelect: "none",
    cursor: "pointer",
    display: "none",
  });

  el.addEventListener("click", () => toastHide(0));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toastHide(0);
  });

  document.body.appendChild(el);
  rootEl = el;
  return el;
}

function bg(type) {
  if (type === "error") return "rgba(231,76,60,.95)";
  if (type === "warn")  return "rgba(241,196,15,.95)";
  return "rgba(46,204,113,.95)";
}

function toastShow(message, type = "success", ms) {
  const el = ensureRoot();
  clearTimeout(timer);
  const duration = typeof ms === "number"
    ? ms
    : type === "error" ? 3500
    : type === "warn"  ? 2800
    : 2000;

  el.textContent = message;
  el.style.background = bg(type);
  el.style.display = "block";
  requestAnimationFrame(() => { el.style.opacity = "1"; });

  timer = setTimeout(() => toastHide(180), duration);
}

function toastHide(fadeMs = 180) {
  const el = rootEl;
  if (!el || el.style.display === "none") return;
  clearTimeout(timer);
  el.style.transition = `opacity ${fadeMs}ms ease`;
  el.style.opacity = "0";
  setTimeout(() => { el.style.display = "none"; el.textContent = ""; }, fadeMs);
}

export const toast = {
  show: toastShow,
  success: (msg, ms) => toastShow(msg, "success", ms),
  warn:    (msg, ms) => toastShow(msg, "warn", ms),
  error:   (msg, ms) => toastShow(msg, "error", ms),
  hide: toastHide,
};
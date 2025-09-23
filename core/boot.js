// ========================
// 起動オーケストレーション
// core/boot.js
// 目的：ロード画面を出し、初期化し、最終的にホームを表示する
// auth は使用しない（Cognito 判定なし）
// ========================

import { show } from "./router.js";
import { initCommon, refreshUI } from "./controller.js";

let __booting = false; // 再入防止

export async function start() {
  if (__booting) return;
  __booting = true;

  try {
    // 1) ロード画面を表示
    show("loading");
    await nextFrame();

    // 2) デバッグモード時は 1 秒待機（ロード画面確認用）
    const debugOn = document.querySelector(".js-debug-toggle")?.checked;
    if (debugOn) await delay(1000);

    // 3) アプリの共通初期化（イベント配線など）
    await initCommon();

    // 4) 初回表示（boot 側で統一）
    show("home");
    await refreshUI();
  } catch (err) {
    console.error("[boot] initialization failed:", err);
    // エラービューがあれば切替（任意）
    try {
      show("boot-error");
      const log = document.querySelector(".js-boot-error-log");
      if (log) log.textContent = err?.stack || err?.message || String(err || "");
    } catch {}
    alert("初期化に失敗しました。再試行してください。");
  } finally {
    __booting = false;
  }
}

// 「再試行」ボタンで再ブート
document.addEventListener("click", (e) => {
  if (e.target.closest(".js-retry-boot")) {
    start();
  }
});

// ---- utils ----
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

export default { start };
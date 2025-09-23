// ========================
// アプリのエントリポイント
// core/main.js
// ========================

import { start as bootStart } from "./boot.js";

// 起動
window.addEventListener("load", () => {
  // 起動フロー（ロード → 初期化 → ホーム表示）
  bootStart();

  // デバッグ：メインナビの表示/非表示切替（従来の挙動を維持）
  const debugToggle = document.querySelector(".js-debug-toggle");
  const mainNav = document.getElementById("main-nav");
  if (debugToggle && mainNav) {
    debugToggle.addEventListener("change", () => {
      mainNav.classList.toggle("u-hidden", !debugToggle.checked);
    });
  }

  // デバッグ再ブート（ユーザ切替などからの要求を受ける）
  document.addEventListener("app:debug-reboot", () => {
    bootStart();
  });
});
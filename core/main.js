// ========================
// アプリケーションのメインエントリーポイント（起動処理）
// core/main.js
// 目的：アプリの初期化とコントローラーの起動を管理する
// 役割：各機能モジュールを読み込み、適切な順序で初期化を実行する
// ========================

import { initCommon } from "./controller.js";     // 共通機能の初期化関数

// DOMが完全に読み込まれた後にアプリを起動
window.addEventListener("load", () => {
    
  // 1. 共通機能を最初に初期化
  initCommon();
  
  // 2. デバッグモードの切替イベント
  const debugToggle = document.querySelector('.js-debug-toggle');
  const mainNav = document.getElementById('main-nav');

  if (debugToggle && mainNav) {
    debugToggle.addEventListener('change', () => {
      mainNav.classList.toggle('u-hidden', !debugToggle.checked);
    });
  }
});
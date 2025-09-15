// ========================
// シンプルルーター（画面切り替え機能）
// core/router.js
// 役割：複数の画面（ビュー）を切り替える機能を提供
// 特徴：SPAライブラリを使わずに、純粋なJavaScriptで実装したシンプルなルーター
// ========================

/**
 * 指定ビューを表示し、他は隠す
 * @param {string} viewName data-view の値
 */
export function show(viewName) {
  // ビュー本体
  document.querySelectorAll(".js-view").forEach((s) => {
    const active = s.dataset.view === viewName;
    s.classList.toggle("is-active", active);
    s.hidden = !active;
  });

  // ナビ状態
  document.querySelectorAll(".js-route").forEach((btn) => {
    const active = btn.dataset.view === viewName;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-current", active ? "page" : "false");
  });
}
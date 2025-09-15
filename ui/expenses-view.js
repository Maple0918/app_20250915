// ========================
// 支出一覧表示機能（UI層）
// ui/expenses-view.js
// 役割：支出データを一覧表として画面に表示する
// 表示内容：4列構成（カテゴリ / 金額 / 日付 / 支払者）
// 表示ルール：
// - 承認済み清算の最新日時より前に「最終更新」された支出は非表示
// - 論理削除（deleted=true）されたデータは非表示
// - 最大10件まで表示
// - 行クリックで詳細画面に遷移（window.__showExpenseDetail が存在する場合）
// ========================

export async function renderExpensesTable() {
  console.log("[UI] renderExpensesTable called");
}
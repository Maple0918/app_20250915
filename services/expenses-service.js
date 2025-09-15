// ========================
// 支出ビジネスロジック（Service層）
// services/expenses-service.js
// 役割：支出データの操作に関するビジネスルールを管理
// 特徴：
// - Repository層（データアクセス）とUI層の中間に位置
// - 複雑なビジネスロジックを集約
// - 会計的な整合性を保つための仕訳処理を含む
// ========================

export async function addExpense(exp) {
  console.log("[Service] addExpense", exp);
  return Promise.resolve();
}

export async function editExpense(exp) {
  console.log("[Service] editExpense", exp);
  return Promise.resolve();
}

export async function deleteExpense(id) {
  console.log("[Service] deleteExpense", id);
  return Promise.resolve();
}
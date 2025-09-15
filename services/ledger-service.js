// ========================
// 台帳ビジネスロジック（会計処理の中核）
// services/ledger-service.js
// 役割：複式簿記の概念に基づいた会計処理を管理
// 特徴：
// - 仕訳（しわけ）：会計取引を記録する基本単位
// - 台帳方式：過去の記録は削除せず、逆仕訳で相殺
// - 等分計算：支出を2人で平等に分割
// - 端数処理：支払者が端数を負担
// ========================


export async function calcBalance() {
  console.log("[Service] calcBalance");
  // Aさん/Bさんの差額を 0 として返すダミー
  return { totalA: 0, totalB: 0, diff: 0 };
}
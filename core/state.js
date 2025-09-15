// ========================
// アプリケーション状態管理（グローバルな状態を管理）
// core/state.js
// 役割：アプリ全体で共有される状態（データ）を一元管理する
// 特徴：シンプルな状態管理パターン
// ========================

// 現在のユーザー
export let currentUser = "Aさん";
export function setCurrentUser(u) { currentUser = u; }

// 編集中の支出ID（null=新規）
export let editingId = null;
export function setEditingId(id) { editingId = id; }